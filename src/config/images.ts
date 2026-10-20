/**
 * Stock photography (Unsplash License — free for commercial use, no attribution required).
 * Swap these for the client's own photos when available.
 */
const unsplash = (id: string, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

export const images = {
  heroPlantation: unsplash("1762686852371-763b689910b2", 1920),
  coffeeBlossom: unsplash("1762004456291-016c26cc59c9"),
  cherriesOnBranch: unsplash("1515694590185-73647ba02c10"),
  cherriesHandful: unsplash("1670758611084-e216510c5433", 1200),
  greenBeans: unsplash("1703646619157-eb553d16d402"),
  greenBeansScoop: unsplash("1561766858-62033ae40ec3"),
  beansInSack: unsplash("1524350876685-274059332603"),
  sacks: unsplash("1565273975921-c884f2b703df"),
  roaster: unsplash("1773118360501-00f979fd9322"),
  roastedBeans: unsplash("1447933601403-0c6688de566e"),
  roastedPile: unsplash("1513530176992-0cf39c4cbed4"),
  cupping: unsplash("1762195880370-9d68ec30bfe9"),
  cuppingPour: unsplash("1558996163-68db2afefba6"),
  instantPowder: unsplash("1770123366817-743776f66d6a"),
  instantMug: unsplash("1614767866551-fe60a95d0d19"),
  packagedBags: unsplash("1512372388054-a322888e67a6"),
  containerStacks: unsplash("1678182451047-196f22a4143e", 1920),
  cargoShip: unsplash("1578575437130-527eed3abbec", 1920),
  portCrane: unsplash("1706499856012-14f062c72b49", 1920),
  tokyo: unsplash("1513407030348-c983a97b98d8", 1920),
  manila: unsplash("1598258710957-db8614c2881e", 1920),
  seoul: unsplash("1546874177-9e664107314e", 1920),
  sydney: unsplash("1624138784614-87fd1b6528f8", 1920),
  dubai: unsplash("1512453979798-5ea266f8880c", 1920),
};
