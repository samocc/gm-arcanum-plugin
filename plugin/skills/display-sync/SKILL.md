---
name: display-sync
description: Re-sync the companion app with the current session's full state (transcript + party status).
user-invocable: true
---

1. Add the following marker to the end of your response. This is an **event marker** — exact match, no trailing content.
```
>> **Display Sync**
```
If there was no narration or text on the player turns then this is your entire response. Otherwise respond normally to the player turns then add the marker.
