# Blood Bowl Playbook

An interactive tool for Blood Bowl players to set up board scenarios and analyze their
options. Place players from both teams on the pitch, then:

- **Block analysis** — select a player and click an adjacent opponent to see the block
  dice count (1D/2D/3D and who chooses), the assists on each side, and the percentage
  chance of each block result. Block, Dodge, Guard and Tackle are factored into assists
  and outcomes, and summary stats show knockdown, push, and turnover odds.
- **Tackle-zone overlays** — visualize how many squares each team is controlling: red
  zones, blue zones, or the net control map (red minus blue per square).
- **Dodge overlay** — with a player selected, every adjacent square shows the dodge
  target number needed to move there (with Dodge re-roll odds in the tooltip).

Built with Vue 3, Pinia, Tailwind CSS and Vite. The rules logic lives in
`src/lib/rules/` and is covered by Vitest unit tests.

## Usage

- Configure stats/skills in **Add players**, hit **Place on pitch**, and click empty
  squares to drop players. Press <kbd>Esc</kbd> or **Done placing** to stop.
- Click a player to select it; click an empty square to move it.
- Click an adjacent opponent to open the block analysis; click again to dismiss.
- Use the **Overlay** buttons to switch visualizations.

## Development

```sh
npm install
npm run dev        # hot-reload dev server
npm run test:unit  # rules engine tests (Vitest)
npm run build      # type-check + production build
npm run lint       # ESLint
```
