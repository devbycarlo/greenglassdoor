# 🚪 Green Glass Door / Going on a Picnic

A tiny, one-file deduction game about the world's most exclusive club. The bouncer lets some things in and turns others away — figure out the secret rule before everyone else does.

**▶ Play it live: https://greenglass.web.app**

---

## 🎯 The 30-second pitch

You're going on a picnic. You can bring anything you like... *as long as it obeys the secret rule*. Nobody tells you the rule. You learn it by trial, error, and increasingly suspicious guesses.

For example, if the rule is **"items must contain double letters"**:

| Guest | Brings | Bouncer |
|---|---|---|
| Alex | **App**les | ✅ Approved |
| Jordan | Bana**nas** | ❌ Rejected |

Sneaky detail: the *destination* matters in some rules too. "New Yor**k** → **K**angaroo" is a classic.

---

## 🕹️ Two ways to play

### 🤖 Solo vs AI — "Beat the Bouncer"
A robot bouncer picks a secret rule and judges everything you bring.

- Test as many items as you like — every attempt is logged in the **Approved Manifest** and **Rejected at the Gate**
- Watch your **🔥 streak** grow with each correct guess
- Ask for **two progressive hints** when you're stuck — each hint costs 1 🔥 streak point
- Pick from 10 rule names in the "Crack the Secret Rule" panel — or surrender and reveal the answer
- New rule and destination every game (the rule may repeat)
- Hears a spoken verdict on every item: "Yes you can bring that" or "Sorr you cannot bring that" (respects the 🔊 toggle)

### 🎉 Party Host — "Pass & Play"
You're the game master. Keep the screen away from the players!

- Generate a **secret rule** from three difficulty tiers: Easy, Medium, Mind-Bender
- Or write your **own custom rule** — you decide what gets through the door
- Add/remove players and track each person's approved/denied count
- Pass the device around and log guesses with **Auto-Evaluate & Log** (AI judges generated rules instantly) or **ALLOW ✓ / DENY ✗** (host judges manually — required for custom rules)
- Every decision lands in the **live group log feed** with player, item, destination, and timestamp
- "Peek Secret Rule" is deliberately blur-toggled so you can check it without ruining the surprise

---

## ✨ The good stuff

- 10 rules across 3 difficulty levels
- Sound effects synthesized in-browser (approve, deny, win) — with a mute button
- Full keyboard-friendly forms and a responsive dark "glass" UI
- No backend, no accounts, no saves — just open and play
- Everything lives in **one HTML file**

---

## 🚀 Play / run it

Just open the live link — no install required:

**https://greenglass.web.app**

Want to run your own copy? It's one file:

```bash
# Option 1: double-click index.html
# Option 2: serve it locally
cd "C:\Users\Administrator\Local Sites\greenglassdoor"
python -m http.server 8765
# then open http://localhost:8765
```

Heads-up: the page loads version-pinned Vue 3 and Tailwind scripts from CDNs, so it needs an internet connection the first time. Vue is integrity-checked (SRI); the Tailwind Play CDN sends no CORS header, so SRI is impossible there. Run the network-free tests with `npm test`.

---

## 📁 What's in this repo

| File | What it does |
|---|---|
| `index.html` | The entire game — markup, styles, rules engine, audio, and Vue app. No build step. |
| `firebase.json` | Firebase Hosting config: publishes `.` to the `greenglass` site, rewrites all routes to `index.html`. |
| `.firebaserc` | Points the CLI at the `greenglassdoor` Firebase project. |
| `package.json` / `package-lock.json` | Firebase **client** SDK (not needed to serve the static app) and the `npm test` script. The deploy CLI (`firebase-tools`) is installed globally, not here. |
| `test/game.test.js` | Network-free regression tests for the rule engine, hints, and host judging. Run with `npm test`. |
| `node_modules/` | Installed dependencies — not published. |

---

## 🔥 Deploying

Firebase Hosting, project `greenglassdoor`, site `greenglass`:

```bash
firebase login
firebase deploy --only hosting
```

The CLI will publish exactly one file (`index.html`) and release it to **https://greenglass.web.app**.

---

## 🧠 Rule library (spoilers — hosts only!)

Don't peek if you're about to play Solo. 🤫

| Difficulty | Rule | The gist |
|---|---|---|
| Easy | Double Letters | Consecutive repeated letters — *Apple, Glass* |
| Easy | Matches Destination Start Letter | Item starts like the place — *Paris → Pizza* |
| Easy | Odd Letter Count | 3, 5, 7… letters only |
| Easy | Vowel VIP | Starts with A, E, I, O, U |
| Medium | Chain Reaction | Item starts with the destination's **last** letter |
| Medium | Bookends | Item starts and ends with the same letter — *Radar* |
| Medium | Lipogram | No letter **E**. Anywhere. Ever. |
| Medium | Twin Vowels | Two vowels side-by-side — *Tea, Boat, Fruit* |
| Mind-Bender | Symmetric Length | Item length exactly matches destination length |
| Mind-Bender | Vowel Heavy | At least 3 vowels in the item |

---

## 🏆 House rule

> If you crack the rule, **don't spoil it**. Keep making correct guesses and help the host until everyone else figures it out. That's where the real fun is.

Built for people who enjoy saying "wait, *why* did that one work?" a lot. 🕵️
