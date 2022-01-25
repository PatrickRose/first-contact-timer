import * as t from 'io-ts';

export const PhaseDecode = t.union([
  t.literal(1),
  t.literal(2),
  t.literal(3),
  t.literal(4),
  t.literal(5),
]);


export const ApiResponseDecode = t.type({
  turnNumber: t.number,
  phase: PhaseDecode,
  breakingNews: t.union([t.string, t.null]),
  active: t.boolean,
  phaseEnd: t.number
});

export const SetBreakingNewsDecode = t.type({
  breakingNews: t.string
});

export const ControlAPIDecode = t.type({
  action: t.union([
    t.literal('pause'),
    t.literal('play'),
    t.literal('back-turn'),
    t.literal('back-phase')
  ])
});

export const TurnDecode = t.type({
  _id: t.string,
  turnNumber: t.number,
  phase: PhaseDecode,
  phaseEnd: t.string,
  breakingNews: t.union([t.string, t.null]),
  active: t.boolean,
  frozenTurn: t.union([t.null, ApiResponseDecode])
});
