import { createFileRoute, Link } from "@tanstack/react-router";
import { PLANETS, getPlanet } from "@/data/solar-system";
import { SPECIES_IMAGES } from "@/data/species-images";
import { normalizeSpecies } from "@/lib/normalize-species";
import PlanetSphere from "@/components/PlanetSphere";
import FactGrid from "@/components/planet/FactGrid";
import SpeciesCard from "@/components/planet/SpeciesCard";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_site/planets/$planetSlug")({
  head: ({ params }) => {
    const planet = getPlanet(params.planetSlug);
    return {
      meta: [
        { title: `${planet?.name || "Planet"} — Worlds of the Milky Way` },
        { name: "description", content: planet?.tagline || "A world of the solar system." },
      ],
    };
  },
  component: PlanetDetailPage,
});

const FACT_LABELS = [
  ["gravity", "Gravity"],
  ["temperature", "Average temperature"],
  ["atmosphere", "Atmosphere"],
  ["day_length", "Day length"],
  ["radiation", "Radiation level"],
  ["surface_type", "Surface type"],
  ["distance", "Distance from the Sun"],
];

function PlanetDetailPage() {
  const { planetSlug } = Route.useParams();
  const local = getPlanet(planetSlug);


  if (!local) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <p className="mono-label text-[#00F2FF]/70">No such world</p>
        <h1 className="mt-4 font-heading text-3xl text-white">This orbit is empty.</h1>
        <p className="mt-3 text-white/50">
          Only the eight surveyed worlds have records. The ninth is still yours to design.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-heading text-sm font-semibold text-[#020408]"
        >
          Back to the system
        </Link>
      </div>
    );
  }

  const localFacts = {
    gravity: local.facts.gravity,
    temperature: local.facts.temperature,
    atmosphere: local.facts.atmosphere,
    day_length: local.facts.day,
    radiation: local.facts.radiation,
    surface_type: local.facts.surface,
    distance: local.facts.distance,
  };

  const facts = FACT_LABELS.map(([key, label]) => ({
    label,
    value: localFacts[key] || "—",
  }));

  const species = normalizeSpecies(local.species);

  const sphere = {
    color: local.color,
    light: local.light,
    dark: local.dark,
    glow: local.glow,
    ring: local.ring,
  };

  const index = PLANETS.findIndex((planet) => planet.slug === planetSlug);
  const prev = PLANETS[(index - 1 + PLANETS.length) % PLANETS.length];
  const next = PLANETS[(index + 1) % PLANETS.length];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-10 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All worlds
        </Link>
        <p className="mono-label text-white/25">
          World {String(index + 1).padStart(2, "0")} / 08
        </p>
      </div>

      <div className="mt-10 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex items-center justify-center py-6">
          <div
            aria-hidden="true"
            className="absolute h-[300px] w-[300px] rounded-full border border-white/8 sm:h-[380px] sm:w-[380px]"
          />
          <div
            aria-hidden="true"
            className="absolute h-[420px] w-[420px] rounded-full border border-white/5 sm:h-[500px] sm:w-[500px]"
          />
          <span
            aria-hidden="true"
            className="absolute h-[190px] w-[190px] rounded-full blur-3xl sm:h-[250px] sm:w-[250px]"
            style={{ background: local.glow }}
          />
          <PlanetSphere planet={sphere} size={230} className="relative animate-float" />
        </div>

        <div>
          <p className="mono-label text-[#00F2FF]/70">{local.kind}</p>
          <h1 className="mt-4 font-heading text-5xl font-medium tracking-[-0.03em] text-white sm:text-6xl">
            {local.name}
          </h1>
          <p className="mt-4 max-w-xl font-heading text-lg text-white/70">{local.tagline}</p>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/50">{local.teaser}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/12 px-3.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/60">
              {local.au} AU
            </span>
            <span className="rounded-full border border-white/12 px-3.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/60">
              {species?.name || "Surveying"}
            </span>
            <Link
              to="/design"
              className="rounded-full border border-[#8A2BE2]/40 bg-[#8A2BE2]/10 px-3.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#D9A8FF] transition-colors hover:bg-[#8A2BE2]/20"
            >
              Design a rival world
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-2xl font-medium text-white sm:text-3xl">
            Environmental telemetry
          </h2>
          <p className="mono-label text-white/25">Measured values · published mission science</p>
        </div>
        <div className="mt-6">
          <FactGrid facts={facts} />
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-2xl font-medium text-white sm:text-3xl">
            Native species
          </h2>
          <p className="mono-label text-white/25">One documented inhabitant</p>
        </div>

        <div className="mt-6">
          <SpeciesCard
            species={species}
            image={SPECIES_IMAGES[planetSlug]}
            note="Invented organism · every trait follows from the measured conditions above."
          />
        </div>
      </section>

      <nav className="mt-16 grid gap-4 border-t border-white/8 pt-8 sm:grid-cols-2">
        <Link
          to="/planets/$planetSlug"
          params={{ planetSlug: prev.slug }}
          className="group flex items-center gap-4 rounded-2xl border border-white/8 p-5 transition-colors hover:border-white/25"
        >
          <ArrowLeft className="h-4 w-4 text-white/30 transition-transform group-hover:-translate-x-1" />
          <PlanetSphere planet={prev} size={34} />
          <span>
            <span className="mono-label block text-[0.5rem] text-white/30">Previous world</span>
            <span className="font-heading text-base text-white">{prev.name}</span>
          </span>
        </Link>
        <Link
          to="/planets/$planetSlug"
          params={{ planetSlug: next.slug }}
          className="group flex items-center justify-end gap-4 rounded-2xl border border-white/8 p-5 text-right transition-colors hover:border-white/25"
        >
          <span>
            <span className="mono-label block text-[0.5rem] text-white/30">Next world</span>
            <span className="font-heading text-base text-white">{next.name}</span>
          </span>
          <PlanetSphere planet={next} size={34} />
          <ArrowRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-1" />
        </Link>
      </nav>
    </div>
  );
}