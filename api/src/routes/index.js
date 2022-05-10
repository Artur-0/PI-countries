const { Router } = require("express");
const express = require("express");
const axios = require("axios");
const { Country, Activity, country_activity } = require("../db.js");
// Importar todos los routers;
// const getAll = require("./getAll.js");
// Ejemplo: const authRouter = require('./auth.js');
const { Op } = require("sequelize");

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
router.use(express.json());

// //get API data:
// // data toma solo la informacion que necesitamos
const data = async () => {
  const api = await axios.get("https://restcountries.com/v3/all"); // guardo toda la data en arr

  const necessaryData = await api.data.map((c) => {
    // me guardo solamente la data necesaria mapeando el array de la API
    return {
      id: c.cca3,
      name: c.name.common,
      flag: c.flags[0],
      continent: c.continents[0],
      capital: c.capital ? c.capital[0] : "Capital not found",
      subregion: c.subregion ? c.subregion : "SubRegion not found",
      area: c.area,
      population: c.population,
      language: c.languages,
    };
  });

  // save data in database
  let has = await Country.findAll(); // checkeo que la tabla este vacia
  if (!has.length) await Country.bulkCreate(necessaryData); // si esta vacia le agrego todos los datos

  return necessaryData;
};

//------------------------------------//-----------------------------------------------------------//

// get ALL countries
router.get("/countries", async (req, res) => {
  const name = req.query.name;
  await data();
  if (name) {
    try {
      const found = await Country.findAll({
        where: {
          name: {
            [Op.iLike]: "%" + name + "%",
          },
        },
        include: { model: Activity },
      });
      found.length
        ? res.send(found)
        : res.status(404).send({ error: "Country not found" });
    } catch (error) {
      return res.send(error);
    }
  } else {
    try {
      let countries = await Country.findAll({
        order: ["name"],
      });
      res.json(countries);
    } catch (error) {
      res.send(error);
    }

    // try {
    //   res.json(await data());
    // } catch (error) {
    //   res.send(error);
    // }
  }
});

//------------------------------------//-----------------------------------------------------------//

// get country by ID

router.get("/countries/:idPais", async (req, res) => {
  const { idPais } = req.params;
  // const allCountries = await data();
  try {
    await data();
    if (idPais.length > 3 || idPais.length < 3) {
      return res.send({ error: "id should have 3 characters" });
    }
    const country = await Country.findByPk(idPais.toUpperCase(), {
      include: {
        model: Activity,
      },
    });
    // let country = await allCountries.find((o) => o.id === idPais.toUpperCase());
    if (country) {
      res.json(country);
    } else {
      res.send({ error: " id not found" });
    }
  } catch (error) {
    res.send(error);
  }
});

//------------------------------------//-----------------------------------------------------------//

// post Activity

router.post("/activity", async (req, res) => {
  await data();
  const { name, difficulty, duration, season, countryId } = req.body;
  try {
    const [activity, created] = await Activity.findOrCreate({
      where: {
        name,
        difficulty,
        duration,
        season,
      },
    });
    await activity.setCountries(countryId);
    res.status(200).send(activity);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
