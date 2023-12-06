export function sortBy<T>(sortOrder?: 'asc' | 'desc', sortValue?: string | number | ((data?: T) => string | number)): (a: T, b: T) => number {
  const order = sortOrder === 'desc' ? -1 : 1;

  return (a, b) => {
    const aValue = typeof sortValue === 'function' ? sortValue(a) : sortValue;
    const bValue = typeof sortValue === 'function' ? sortValue(b) : sortValue;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order * (aValue.localeCompare(bValue, undefined, { sensitivity: 'base' }));
    }
    else if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order * (aValue - bValue);
    }
    return 0;
  };
}