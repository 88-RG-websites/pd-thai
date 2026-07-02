# Git Basics

A quick guide to the everyday git workflow. You don't need to memorize any of this — it'll become muscle memory fast, and there's an even easier shortcut at the bottom.

## The core idea

Everyone works off a shared copy of the code called **main**. Your job is to:

1. Grab the latest version before you start
2. Make your changes
3. Save them (commit)
4. Send them back up so everyone else gets them (push)

That's the whole loop. Here's how it looks in practice.

## The daily workflow

### 1. Start on main and pull the latest

Before you touch anything, get everyone else's recent changes:

```
git checkout main
git pull origin main
```

`checkout main` makes sure you're on the main branch. `pull` downloads any changes other people have pushed.

### 2. Make your changes

Edit files, do your work. Nothing git-related here yet.

### 3. Stage your changes

Once you've got a chunk done, tell git which files you want to save. This is called **staging**.

```
git add .                 # stage all changed files
git add path/to/file      # stage just one specific file
```

`git add .` is the easy one — it grabs everything you changed.

### 4. Commit with a message

A **commit** is a saved snapshot with a short note describing what you did:

```
git commit -m "Add contact form to homepage"
```

Keep the message short and describe what changed.

### 5. Push to GitHub

This sends your commits up so everyone else can pull them:

```
git push origin main
```

### 6. Repeat

That's it. Pull at the start, commit and push as you go. Rinse and repeat.

## Next step: branches (for later)

For now, working directly on main is totally fine while you get comfortable. Once you're ready, the next thing to learn is **branches** — a way to work on something separately without touching main until it's ready.

The flow is almost the same, with two extra steps:

```
git checkout main
git pull origin main
git checkout -b my-new-feature   # create and switch to a new branch
```

Then you make changes, stage, and commit exactly like before. When you push, you push to your branch instead of main:

```
git push origin my-new-feature
```

When you're done, go to GitHub and open a **pull request** (PR). This lets you review the changed code and merge it into main. After it's merged, switch back and pull:

```
git checkout main
git pull origin main
```

No rush on this — the main-only workflow above will carry you a long way.

## The shortcut (for once you've got the hang of it)

Once these steps feel natural, know that you don't always have to run them by hand — you can just tell Claude "commit and push" and it'll handle the staging, commit message, and push for you.

For now though, it's worth doing it manually a few times so you understand what each step is actually doing. The shortcut will still be there later.
