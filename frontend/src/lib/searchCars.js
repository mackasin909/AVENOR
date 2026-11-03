export function searchCars(cars, query) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return cars;

  return cars.filter((car) => {
    const haystack = [
      car.name,
      car.year,
      car.location,
      car.fuelType,
      car.engine,
      car.gearbox,
    ]
      .join(" ")
      .toLowerCase();

    return words.every((word) => haystack.includes(word));
  });
}