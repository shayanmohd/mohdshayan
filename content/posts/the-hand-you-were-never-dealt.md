---
title: The hand you were never dealt
date: 2026-09-05
summary: How Turup Chaal stops card-game cheating by construction. The host validates every move and never sends a client a card it should not know about.
tags: Multiplayer, Unity, Anti-cheat
draft: true
---

Every online card game has the same enemy. Not the player who plays badly, the player who can see your hand.

When I built Turup Chaal, a four-player Court Piece game for Android, I wanted cheating to be impossible rather than merely detected. Detection means you already lost the round. The design I settled on has two halves, and both of them live on the host.

## The engine does not trust anyone

The rules engine is plain C#. It has no reference to Unity's types, no scene, no networking. It deals the 5-4-4 pattern, validates the trump call, enforces follow-suit, resolves each trick, and counts to seven. Because it is deterministic (shuffles are seeded), the same engine runs a practice match on one phone and the online match for four.

Online, exactly one peer runs that engine: the room's host. Everyone else, including the host's own screen, only sends intents. Tapping a card does not play the card. It sends a `PlayCardIntent` to the host, and the host asks the engine whether the move is legal.

That check is short and unforgiving:

```csharp
if (State.Phase != MatchPhase.Playing)  return Reject("Game is not in playing phase.");
if (player.Seat != State.CurrentTurnSeat) return Reject("It is not this player's turn.");
if (IndexOfCard(player.Hand, card) < 0)  return Reject("Card is not in player's hand.");
if (hasLedSuit && card.Suit != ledSuit)  return Reject("Player must follow led suit.");
```

A client that lies about its turn, plays a card it does not hold, or refuses to follow suit gets a rule violation event back and nothing changes. There is no "trust the client and reconcile later". The client was never allowed to change the game in the first place.

## The half most games skip

Validation stops a client from playing an illegal card. It does nothing to stop a client from *reading* the other hands.

In a naive design the host broadcasts the full game state to everyone and each screen simply hides the cards it should not show. That is a rendering decision, and rendering decisions are made on hardware you do not control. A patched client, a memory reader, or a rooted phone can show every hand at the table.

So Turup Chaal never broadcasts the full state. After each accepted move the host builds a separate snapshot for each player and sends it only to that player:

```csharp
string json = BuildRedactedSnapshotJson(targetPlayerId);
gateway.RaiseToActor(TurupNetEvents.Snapshot, payload, actor);
```

The redacted snapshot contains your own hand, the cards on the table, the trick counts, and whose turn it is. Your three opponents' hands are stripped out. So is the undealt deck. A modified client cannot reveal what it was never sent, because the information does not exist on that device.

## Why this is cheaper than it sounds

People assume per-player redaction is expensive. It is four small JSON payloads per move, in a game where a move happens every few seconds. The cost that matters is design cost, and it is paid once: the engine has to expose a "state as seen by player X" view, and the network layer has to address messages to individual actors instead of the room. Photon PUN2 supports both.

What you get back is a game where the security argument fits in one sentence. The host decides what happened, and each phone only ever learns its own part of it.

Turup Chaal is on [Google Play](https://play.google.com/store/apps/details?id=com.socialsure.turupchaal) and the [source is on GitHub](https://github.com/shayanmohd/Turup-Chaal).
