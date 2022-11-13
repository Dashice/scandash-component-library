let iteration = 0;

export const generateID = (name: string) => {
  iteration += 1;
  return `scandash-${iteration}-${name}`;
};
