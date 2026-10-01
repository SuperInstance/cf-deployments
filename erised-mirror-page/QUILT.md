# Quilt — Mapping `erised` to Quilt's 5 opcodes

`erised` is the **product form of the Quilt cell-fabric, specialized for cooperative fiction**. It maps onto Quilt's 5-opcode primitive (`BIND`, `LINK`, `EFFECT`, `VIEW`, `TICK`).

## The 5 opcodes

| Opcode | Role in Quilt | Role in `erised` |
|--------|---------------|-------------------|
| `BIND`  | Atomically associate a payload with a tag | `addScar()` binds a scar entry to a tick + kind + note |
| `LINK`  | Create a typed edge between cells | `updateCitations()` links a character to another character by name reference |
| `EFFECT`| Execute a side effect in the world | `runTick()` triggers the LLM calls and updates state |
| `VIEW`  | Read the current shape of the tensor | `render()` reads `state.transcript` + `state.citations` + `state.scars` without mutating |
| `TICK`  | Advance the wall-clock by one step | The Tick button — explicit operator action |

## Polyformalism

`erised` is **model-agnostic at the protocol level**. The `callLLM()` dispatch accepts any `(prefix, model)` pair where the prefix has a registered backend. We ship:
- `zai:glm-4.5` (Z.AI coding endpoint)
- `deepinfra:ByteDance/Seed-2.0-mini` (cheap, creative)
- `deepinfra:ByteDance/Seed-2.0-code` (code-specialized)
- `deepinfra:moonshotai/Kimi-K3` (reasoning-capable)

Adding a new provider is a single if-block in `callLLM()`.

## Negative space as payload

The DM's role is to keep the scene *open enough* for characters to fill it. If the DM over-specifies, the characters have nothing to add. The "Game-master" system prompt tells the DM: *"NEVER invent cast members not given to you"* — that's the **negative-space discipline** at the protocol level.

## Cadence as temporal authority

Each character has its own LLM assignment, which determines the **cadence** of their contribution. The Mechanic (zai) tends to be terse and technical; the Shepherd (Seed-mini) tends toward poetic; the Chronicler (Seed-code) tends toward numerical. **The LLM assignment IS the rhythm.**

The user can swap the LLM at runtime by changing the dropdown. **That's `cadence` as a runtime-editable property.**

## Conservation invariant

The time economy is a `BIND` invariant. A character cannot produce a turn when its `ticks_used >= ticks + earned_resonance`. The system enforces this without negotiation — out-of-ticks characters become *off-screen* (visible but inert).

## Heritage and lineage

`erised` keeps its state in `localStorage`. A "session" is one `localStorage` entry. **There is no Quilt mitosis here** — the product is single-user, single-window. Multi-user cooperative fiction would require extending with a Quilt cell-router (a2a-v3 style) on the back end.

## Dehooker Axiom

The Tick button is the **dehooker**. The operator stops parsing and switches to pre-compiled execution. *Click Tick → the system runs → read the seam.*

The button is large. The button is the only thing the operator needs to do. Everything else is the system's job.

## Empty Room

`erised` ships blank by default. The opening canvas is empty. **The operator fills it by what they bring.** The Mirror of Erised shows the heart's desire — but only if the operator brings something to see.

## See also

- `gsim.py` — the upstream harness (Python)
- `quilt-conversation` — Rust crate for inter-agent communication (the timing layer)
- `lau-tensor-midi` — upstream timing engine
- `SUPERINSTANCE/quilt` — the cell-fabric specification
