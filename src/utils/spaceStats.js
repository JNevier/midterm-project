// Home page stats, computed from the listings so they are never typed in.
export const getSpaceStats = (spaces) => ({
  spaceCount: spaces.length,
  cityCount: new Set(spaces.map((space) => space.city)).size,
  lowestRate: spaces.length ? Math.min(...spaces.map((space) => space.price)) : null,
  open24HoursCount: spaces.filter((space) => space.hours === '24/7').length,
});
