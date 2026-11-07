# Kreo Surge XB: Interactive Setup Guide

An interactive, step-by-step 3D guide for the **Kreo Surge XB** controller. Pick what you want to do, follow the steps, and see exactly which button or part to use on a 3D model.

> **Disclaimer:** I am not affiliated with Kreo in any way. This is not an official Kreo product. I am not selling anything. It is a free, open source project I made for myself and for anyone who finds it useful.

## Why I made this

- **The manual was hard to follow.** I had trouble understanding the printed guide, and I don't enjoy reading long manuals.
- **I wanted easy, visual steps.** So I built something that shows each step on the controller itself, one at a time.
- **What if I lose the manual?** Now the whole guide lives online, so I (and you) can always find it.
- **No video covered everything.** I couldn't find a YouTube video that answered all my doubts or covered the full guide.
- **So I fed the manual to AI and built this.** As a designer I hit this problem, and with AI I could build a solution. If I have a solution, why not give it to others for free?

I think Kreo should offer something like this officially, so users can just open the setup and go step by step.

## How to use it

**Easiest:** download `Kreo-Surge-XB-Interactive-Guide.html` and open it in your browser. It works fully offline, with the 3D model and all manual pages included.

**Or run the site locally:**

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Then open `http://127.0.0.1:4173`.

## What's inside

- Step-by-step walkthroughs with a highlighted 3D controller
- Search to find a walkthrough fast
- The original manual pages, viewable anytime

Want to edit or rebuild it? See [DEVELOPING.md](DEVELOPING.md).

## License

Free and open source. Use it, share it, improve it.
