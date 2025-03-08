export default function MinitelTSState({ initial = {}, name = 'state' }: { initial?: any, name?: string } = {}) {
  let internalState = initial;

  const setState = (newState: any) => {
    internalState = { ...internalState, ...newState };
  };

  return {
    get [name]() {
      return internalState;
    },
    [`set${name.charAt(0).toUpperCase() + name.slice(1)}`]: setState,
  };
}
