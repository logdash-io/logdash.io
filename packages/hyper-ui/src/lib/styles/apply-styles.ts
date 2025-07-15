// This function is not needed for workspace packages as CSS is imported directly
export const applyStyles = async () => {
  console.warn(
    "applyStyles is deprecated in workspace packages. Import CSS directly instead."
  );
};
