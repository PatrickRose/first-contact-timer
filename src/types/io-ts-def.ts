import * as t from 'io-ts';

export const PhaseDecode = t.union([
  t.literal(1),
  t.literal(2),
  t.literal(3),
]);

export const BreakingNewsDecode = t.type({
  1: t.union([t.string, t.null]),
  2: t.union([t.string, t.null]),
  3: t.union([t.string, t.null]),
})

export const ApiResponseDecode = t.type({
  turnNumber: t.number,
  phase: PhaseDecode,
  breakingNews: BreakingNewsDecode,
  active: t.boolean,
  phaseEnd: t.number
});

export const SetBreakingNewsDecode = t.type({
  breakingNews: t.string,
  number: t.union([t.literal(1), t.literal(2), t.literal(3)])
});

export const ControlAPIDecode = t.type({
  action: t.union([
    t.literal('pause'),
    t.literal('play'),
    t.literal('back-turn'),
    t.literal('back-phase'),
    t.literal('forward-phase'),
    t.literal('forward-turn'),
  ])
});

export const TurnDecode = t.type({
  _id: t.string,
  turnNumber: t.number,
  phase: PhaseDecode,
  phaseEnd: t.string,
  breakingNews: BreakingNewsDecode,
  active: t.boolean,
  frozenTurn: t.union([t.null, ApiResponseDecode])
});
