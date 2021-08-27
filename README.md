<h1 align="center"> 🤖 boterere <br/></h1>

<p align="center"> A work-in-progress Bot I made for a private discord with friends using <b>Node.js</b> and <b>mongoDB</b>.</p>

---

## ⌨️ Commands

### `register`

Users must register in order to use any other command so that the bot can keep track of their balance and statistics:

```bash
.register || .r
```

### `stats`

Users can check their statistics by using the stats command after they're registered:

```bash
.stats || .s
```

### `gift`

If they're feeling generous, users can gift other users some coins by using this command:

```bash
.gift [USER] [AMOUNT] || .g [USER] [AMOUNT]
```

**Example:** `.gift @Marquerere 1000`

### `beg`

If they've lost all their points, users can beg once a day to get some more:

```bash
.beg || .b
```

### `predict`

Users can start a prediction where them and other users can try to guess a certain outcome (decided by the author of the prediction):

```bash
.predict [EVENT] [OUTCOME_1] [OUTCOME_2] || .p [EVENT] [OUTCOME_1] [OUTCOME_2]
```
> This command supports phrases as parameters (use ' or ") and up to 5 outcome parameters.

**Example:** `.predict 'What language was this bot written in?' JavaScript Python`


---

<p align="center">I tried to make the bot the most user friendly possible, if you find any issue or have a suggestion please reach out!</p>
