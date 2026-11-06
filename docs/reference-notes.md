# Reference & Aesthetic Notes — NYM: Song of the Sunken Hive

Creative, architectural, and design notes for the procedural vector Metroidvania project.

---

## 1. Aesthetic Direction: Procedural Silhouette Vector Art

Rather than using rasterized bitmap spritesheets, all characters, monsters, environmental backdrops, and HUD elements in NYM are generated procedurally through HTML5 Canvas 2D paths:

- **Nym (The Player)**:
  - 42px tall cloaked husk knight silhouette.
  - Cracked porcelain mask with dark eye slits.
  - Procedural 2-joint spring/Verlet cloth simulation for Nym's flowing scarf.
  - Needle blade (*Splinter*) with motion trail rendering.
- **Enemies & Bosses**:
  - Modular insectoid anatomy: segmented carapaces, glowing dot ocular nodes, and articulated leg sets.
  - Telegraph cues: minimum 250ms visual anticipation (shake, pupil dilate, color flare) prior to attacks.
- **Lighting & Ambiance**:
  - Multi-tier parallax layers (distant background caverns, midground ruins, foreground terrain).
  - Zone-specific color harmonies (charcoal/amber in Cradle, deep cyan/teal in Cistern, rusted cinder in Ember, pale indigo in Reliquary).

---

## 2. Web Audio Synthesis Architecture

The game incorporates a zero-dependency procedural audio engine built on the Web Audio API:

- **Ambient Zone Beds**: Dual detuned sawtooth/triangle oscillators passed through low-pass resonant filters modulated by slow LFOs (0.05–0.15 Hz).
- **Plucked Melody Notes**: Karplus-Strong string synthesis model triggered at pseudo-random intervals based on pentatonic/minor scale tables per zone.
- **Dynamic Boss Pads**: Heavy filtered square-wave bass droning with frequency-modulated dissonance to convey tension.
- **Procedural SFX**:
  - *Splinter Slash*: Bandpass-filtered white noise burst with downward exponential pitch envelope.
  - *Pogo Bounce*: Metallic ping combining high-frequency sine resonance with sudden dampening.
  - *Heal Chime*: Ascending harmonic triads in sine waves with subtle delay.
