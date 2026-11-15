import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { atmosphereLabel, waterLabel, surfaceLabel, radiationLabel } from "@/lib/planet-options";

const planetInput = z.object({
  planet_name: z.string().min(1).max(40),
  creator_name: z.string().max(40).optional().default(""),
  gravity: z.number().min(0.1).max(5),
  temperature: z.number().min(-250).max(500),
  atmosphere: z.enum(["thin_co2", "thick_nitrogen", "methane", "oxygen", "none", "toxic"]),
  radiation: z.number().min(0).max(100),
  water: z.enum(["none", "ice", "liquid", "ocean"]),
  day_length: z.number().min(1).max(500),
  surface_type: z.enum(["rocky", "icy", "volcanic", "cloud", "ocean"]),
});

const ORGANISM_SCHEMA = {
  type: "object",
  properties: {
    species_name: { type: "string" },
    summary: { type: "string" },
    body_plan: { type: "string" },
    locomotion: { type: "string" },
    senses: { type: "string" },
    diet: { type: "string" },
    reproduction: { type: "string" },
    adaptations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          parameter: { type: "string" },
          trait: { type: "string" },
        },
        required: ["parameter", "trait"],
      },
    },
    threats: { type: "string" },
    weakness: { type: "string" },
    survival_score: { type: "number" },
    image_prompt: { type: "string" },
  },
  required: [
    "species_name",
    "summary",
    "body_plan",
    "locomotion",
    "senses",
    "diet",
    "reproduction",
    "adaptations",
    "threats",
    "weakness",
    "survival_score",
    "image_prompt",
  ],
};

const buildPrompt = (planet) => `You are an astrobiologist writing a specimen entry for a speculative field guide.

The planet is invented. Its parameters are fixed and must be taken literally:
- Name: ${planet.planet_name}
- Surface gravity: ${planet.gravity}× Earth
- Mean surface temperature: ${planet.temperature} °C
- Atmosphere: ${atmosphereLabel(planet.atmosphere)}
- Background radiation: ${radiationLabel(planet.radiation)} (index ${planet.radiation}/100)
- Water availability: ${waterLabel(planet.water)}
- Day length: ${planet.day_length} Earth hours
- Dominant surface: ${surfaceLabel(planet.surface_type)}

Design ONE native organism that is genuinely adapted to this exact combination of conditions.

Hard rules:
1. Stay physically plausible. Standard chemistry and materials only — carbon, minerals, water, ammonia, methane, silicates. No magic, no force fields, no psychic powers, no indestructible materials.
2. Scale the body to gravity: low gravity allows tall, light, thin-limbed bodies; high gravity forces low, dense, wide, load-bearing ones.
3. Temperature, atmosphere, radiation, water and day length must each visibly shape the anatomy or metabolism.
4. Every adaptation must name the exact parameter it answers, quoted with its value.
5. Be specific about dimensions (metres, kilos, hours) instead of vague adjectives.
6. The weakness must be a real environmental condition this organism cannot survive.
7. survival_score is an integer from 35 to 95: how well matched the organism is to this world. Extreme radiation, no water or a vacuum should lower it.

Write the image_prompt as a detailed cinematic 3D render brief for this organism in its habitat: anatomy, materials and surface textures, palette, lighting, composition, shallow depth of field, black or atmospheric background. No text, no humans, no spacecraft.`;

const buildImagePrompt = (organism, planet) =>
  `${organism.image_prompt}

Subject: ${organism.species_name}, a native organism of an invented planet with ${planet.gravity}× Earth gravity, ${planet.temperature} °C average temperature and a ${surfaceLabel(planet.surface_type).toLowerCase()} surface. ${organism.body_plan}

Style: hyper-realistic cinematic 3D render, biologically plausible speculative evolution, rim lighting against a dark background, shallow depth of field, volumetric haze, museum-specimen realism. No text, no lettering, no humans, no spacecraft.`;

const toRecord = (data, organism, imageUrl) => ({
  ...data,
  creator_name: data.creator_name || "",
  radiation_label: radiationLabel(data.radiation),
  species_name: organism.species_name,
  summary: organism.summary,
  body_plan: organism.body_plan,
  locomotion: organism.locomotion,
  senses: organism.senses,
  diet: organism.diet,
  reproduction: organism.reproduction,
  adaptations: Array.isArray(organism.adaptations) ? organism.adaptations.slice(0, 6) : [],
  threats: organism.threats,
  weakness: organism.weakness,
  survival_score: Math.round(Number(organism.survival_score) || 60),
  image_url: imageUrl || "",
});

export const generateOrganism = createServerFn({ method: "POST" })
  .validator(planetInput)
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();

    const organism = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildPrompt(data),
      response_json_schema: ORGANISM_SCHEMA,
    });

    let imageUrl = "";
    try {
      const image = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: buildImagePrompt(organism, data),
      });
      imageUrl = image?.url || "";
    } catch {
      imageUrl = "";
    }

    const record = await base44.asServiceRole.entities.UserPlanet.create(
      toRecord(data, organism, imageUrl)
    );

    return { id: record.id };
  });

export const regenerateOrganism = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(64) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const existing = await base44.asServiceRole.entities.UserPlanet.get(data.id);

    const planet = {
      planet_name: existing.planet_name,
      creator_name: existing.creator_name || "",
      gravity: existing.gravity,
      temperature: existing.temperature,
      atmosphere: existing.atmosphere,
      radiation: existing.radiation,
      water: existing.water,
      day_length: existing.day_length,
      surface_type: existing.surface_type,
    };

    const organism = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${buildPrompt(planet)}\n\nThis is a second survey of the same world: produce a clearly different organism from the obvious first answer.`,
      response_json_schema: ORGANISM_SCHEMA,
    });

    let imageUrl = "";
    try {
      const image = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: buildImagePrompt(organism, planet),
      });
      imageUrl = image?.url || "";
    } catch {
      imageUrl = "";
    }

    await base44.asServiceRole.entities.UserPlanet.update(
      data.id,
      toRecord(planet, organism, imageUrl)
    );

    return { id: data.id };
  });