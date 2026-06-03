# Contributing to ST-GIT

First off, thank you for considering contributing to ST-GIT! It's people like you that make ST-GIT such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make one! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

## Fork & create a branch

If this is something you think you can fix, then fork ST-GIT and create a branch with a descriptive name.

## Get the test suite running

Make sure you have Node.js installed, then run:

```bash
npm install
npm test
```

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first.

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with ST-GIT's master branch:

```bash
git remote add upstream git@github.com:studentxyz92-ux/ST-GIT.git
git fetch upstream
git merge upstream/main
```

Then push your feature branch and make a pull request!
