export function searchCars(cars, query) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return cars;

  return cars.filter((car) => {
    const haystack = [
      car.brand,
      car.model,
      car.year,
      car.location,
      car.fuelType,
      car.engine,
      car.gearbox,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return words.every((word) => haystack.includes(word));
  });
}