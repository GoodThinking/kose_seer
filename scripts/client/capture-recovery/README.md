# Nieo rejected-capture recovery

The pinned `resource/module/PetFightDLL.swf` capsule button closes the controls,
stops the turn timer and decrements its cached inventory before sending CMD 2409.
The fixed core dispatches nonzero results as `SocketErrorEvent`, rather than to
the normal CMD listener. The original capsule button has no error callback, so
an unchanged, full-HP target rejected with 5001 leaves the UI waiting forever.

The replacement class registers a CMD listener and the fixed core's existing
`SocketErrorEvent` listener before sending. It decrements the two inventory
counters only when a normal CMD response confirms consumption, or on 5003
(capture reward persistence failed after consumption). A 5001 rejection keeps
both counters unchanged, including when the last capsule was selected. Error
responses reopen the current player's controls and write a capture-specific
message into the battle log, suppressing the delayed generic error popup.
The existing turn timer then resumes. The generic Alarm API queues popups until
the fight ends, so the patch uses the existing battle log instead. Normal
successful/failed capture responses still go through the original
fight controller and animations. Both listeners are removed on response or
category destruction; unrelated errors are ignored.

No server capture eligibility, RNG, rewards or enemy turns are changed.

Rebuild with existing JRE and FFDec installations:

```sh
node scripts/patch-capture-recovery.cjs INPUT.swf OUTPUT.swf /path/to/java /path/to/ffdec.jar
```

The builder accepts only the pinned input SHA256
`8f9827b56a5071b42bebcd455a3c0b7e84e1c0aadd7789c5302588e668ad9893`,
refuses overwrites and verifies that exactly one ABC tag changes.
Full before/after script exports must also confirm that only
`CatchPetItemCategory` changed. Install the
verified output at the existing client overlay path
`resource/module/PetFightDLL.swf`; remove that overlay to roll back to the
original module. This asset must be paired with the fixed Nieo core; no callback
API from a newer XIN core is required.
