let iteration = 0;
export const generateID = (name) => {
  iteration += 1;
  return `scandash-${iteration}-${name}`;
};
