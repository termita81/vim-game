# Vim / Neovim fidelity

Phase 0 notes. Findings below come from temporary API probes, not a completed Neovim comparison or browser matrix. No curriculum has been authored yet.

| Feature | Observation | Required action / release impact |
| --- | --- | --- |
| Local marks | Follow changes strictly above the position; insertion at the mark boundary leaves it before new text | Review insertion/deletion boundary behavior against Neovim when implementing mapped marks. |
| Marks after buffer swap | `EditorView.setState` rebuilds the Vim plugin and loses local marks | **Blocking for Act 8:** own per-buffer mapped mark manager. |
| Uppercase marks | Jumping from another buffer did not switch buffers | **Blocking for Act 8:** global marks must resolve buffer identity and focus/switch correctly. |
| Same buffer, multiple views | Text sync works; undo is per view | Accepted limitation under Constitution 10.4. Levels cannot require undoing another view's edits. |
| Relative numbers | Own gutter implements `:set relativenumber`, `rnu`, `nornu` | Browser visual playtest pending; Phase 1+ adds preference persistence and other number options. |
| Registers | Preload and native `:reg f` work | Keep native functionality. Broader append/macro-register behavior checked in Phase 5. |
| Visual block | Requires multiple selections enabled in CodeMirror | Enabled in spike; physical Ctrl-v and Neovim comparison pending. |
| Browser shortcuts | Physical behavior untested | **Blocking for Phase 0 signoff:** real OS/browser matrix. Ctrl-w strategy must be confirmed before Act 6 implementation. |
| Ex overrides | Custom quit/edit/write handlers can replace native commands | Spike reports interception only. Do not treat its `:q` / `:w` as authentic save/quit semantics. |
| Neovim defaults | `Y = y$`, hidden buffers, authentic E37/E162/E20 not patched yet | Implement during corresponding phases; do not teach until faithful. |

No approximation labels are currently shown because this spike has no Toolkit. Any retained gameplay approximation must be tagged there and documented here.

## Phase 1 input correction

The spike's capture listener cancelled Ctrl-[ before CodeMirror could handle it, leaving insert mode active. Browser-default prevention now runs after Vim's input handler. Reproduced and verified corrected in Chromium 153; capture-order regression tests added. In the game, Escape/Ctrl-[, Ctrl-r redo, and Ctrl-v visual block were verified through browser input. The original owner's unknown sequence and other browsers still need confirmation.

The game supplies real save/quit/restart/extraction behavior for its single mission buffer. The spike continues to report interception only. Full multi-window/buffer error semantics remain Phases 6–7.
