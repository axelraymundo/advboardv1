module.exports = async (strapi) => {
  console.log("load initial locations");

  const locations = [
    "Venue TBA",
    "Alfiem Games, Estacion St. (Makati)",
    "Aristocrat Roxas Blvd (VIP Room)",
    "Ayala Mall (Marikina)",
    "Black Scoop 9th St. (BGC)",
    "Black Scoop Cafe, Bacoor (Cavite)",
    "Blackscoop Wack Wack, Mandaluyong",
    "Bo's Coffee G5 (Makati)",
    "Cafe De Lipa, Market-Market (BGC)",
    "CBTL Park Triangle (BGC)",
    "CBTL, Adriatico, Malate (Glass House)",
    "CBTL, Double Dragon (Pasay)",
    "CBTL, High Street (BGC)",
    "CBTL, Stop Over (BGC)",
    "Dim Sum Treats, Dapitan (Manila)",
    "Discord Play-by-Post",
    "Discord, Astral",
    "Discord, Foundry VTT",
    "Discord, Google Jamboard",
    "Discord, Roll20",
    "FEU, Main Campus (Manila)",
    "Home (Randoms)",
    "Macao Milktea, Dusit Thani Lite (BGC)",
    "McDo Morayta (FEU)",
    "Mckinley West",
    "One Archers Place (Manila)",
    "One BGC Foodcourt",
    "SB Avida Towers Verte (9th cor. 34th, BGC)",
    "SBC, SM Aura (BGC)",
    "SBC, SM Aura (BGC)",
    "Starbucks, 6750 (Makati)",
    "TableTaft, Unversity Mall (Manila)",
    "Tabletop Lounge (Paranaque)",
    "Taco Bell, Cyberpark (Cubao)",
    "Tectite, Legarda (Manila)",
    "Tim Hortons, Glorietta 4 (Makati)",
    "Tim Hortons, The Link (Makati)",
    "Tropical Hut, Buendia (Makati)",
    "Neutral Grounds, MAKATI",
    "Neutral Grounds, CENTRIS",
    "Buku-buku, South Mall, Las Pinas",
    "Neutral Grounds, ALABANG",
    "Neutral Grounds, VERTIS",
    "Whistlestop, Jupiter (Makati)",
    "Highlands Coffee, Double Dragonn",
    "Dragon Forge, Quezon City",
    "Beanjour, Sapang Palay Bulacan",
    "Owlbear Rodeo, Google Meet",
    "Starbucks, Molitos Alabang",
    "Neutral Grounds, CAVITE",
    "Coffee Project, SMall SJDM Bulacan",
    "WalterMart, Starbucks Makati",
    "Coffee Project, Donbosco Makati",
    "Brioso Coffee, The Beacon Makati",
    "SMX Mall of Asia",
    "Trading Post, BGC",
    "Emilio's Cafe & Restaurant",
    "Edsa, Shang-Rila",
    "Starbucks, MCU Caloocan",
    "Yengcha Tea House, Pasig",
    "Owlbear Rodeo, Discord",
    "Felize Cafe, Gen Trias Cavite",
    "CBTL, Acacia States",
    "Starbucks, WCC Mandaluyong",
    "Blackscoop,Cali Garden Sq Manda",
    "Starbucks, Vermosa Imus Cavite",
    "SecreT BasE Gaming Lounge, Marikina",
    "Vue Bar, Bellevue Hotel Alabang",
    "Café Excelsior 47, BF Pque",
    "JPMC Tower Game Room, BGC",
    "Buku-buku,  Filinvest Alabang",
    "CBTL, Cherry Mall Wack Wack",
    "Starbucks, Antlers Square Dasma",
    "Starbucks, Centris QC",
    "Motorino, One Neo Bldg BGC",
    "CBTL 9th Ave., (BGC)",
    "Starbucks, SM Fame, Mandaluyong",
    "Mint College, Silver City Pasig",
    "Manipopcon, Ayala By The Bay Pasay",
    "Blackscoop, Ayala Terraces Fairview QC.",
    "CBTL, Uptown Mall BGC",
    "Starbucks, North Fairview QC.",
    "Blackscoop, Cubao Araneta Center QC",
    "Seattle's Best, Dasmariñas",
    "Near Cafe, Manila",
    "Starbucks, De Students Place Taft, MNL",
    "Starbucks, 28th Street BGC",
    "Mahiwaga Cafe, Quezon City",
    "CBTL, Tehcnohub Quezon City",
    "Cafe Hoonee, Taft Ave, Manila",
  ];

  const templates = [];
  locations.map((l) => {
    templates.push({ name: l });
  });

  const templatesCount = await strapi.db
    .query("api::location.location")
    .count();

  if (templatesCount <= 0) {
    const knex = strapi.db.connection.context;

    if (String(knex.client.config.client).includes("sqlite")) {
      await knex.raw("delete from sqlite_sequence where name='locations';");
    } else {
      await knex.raw("TRUNCATE TABLE locations");
    }

    const loaded = await strapi.db
      .query("api::location.location")
      .createMany({ data: templates });

    console.log(loaded);
  }
};
