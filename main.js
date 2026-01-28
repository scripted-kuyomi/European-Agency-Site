const citySelect = document.getElementById("citySelect");
const getForecastBtn = document.getElementById("getForecastBtn");
const forecastEl = document.getElementById("forecast");
const statusEl = document.getElementById("status");

function prettyWeather(code){
    if(!code) return "";
    return code.replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function setStatus(msg) {
    statusEl.textContent = msg || "";
}

async function loadCitiesFromCSV(path){
    const resp = await fetch (path);
    if (!resp.ok) throw new Error(`Could not load CSV: ${resp.status}`);

    const text = await resp.text();
    const lines = text.trim().split(/\r?\n/);

    //skip header row
    const startIndex = 1;

    const cities = [];
    for (let i = startIndex; i < lines.length; i++) {
        const row = lines[i].split(",").map(s => s.trim());
        if (row.length < 3) continue; 
        
    const [latStr, lonStr, name] = row;

    const lat = Number(latStr);
    const lon = Number(lonStr);

    if (!name || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    cities.push({name, lat, lon});
    }
    return cities;
}

function populateCityDropdown(cities) {
    citySelect.innerHTML = cities
    .map((c, i) => `<option value="${i}">${c.name}</option>`)
    .join("");
}

function buildApiUrl (lat, lon) {
     return `https://www.7timer.info/bin/api.pl?lat=${lat}&lon=${lon}&product=civillight&output=json`;
}

const iconMap = {
    clear:"clear.png",
    pcloudy:"pcloudy.png",
    mcloudy:"mcloudy.png",
    cloudy:"cloudy.png",

    humid:"humid.png",
    fog:"fog.png",
    windy:"windy.png",

    lightrain:"lightrain.png",
    rain: "rain.png",
    oshower:"oshower.png",
    ishower:"ishower.png",
    
    lightsnow:"lightsnow.png",
    snow:"snow.png",
    rainsnow:"rainsnow.png",

    ts:"tstorm.png",
    tsrain:"tsrain.png",
};

function renderForecast (cityName, dataseries) {
    forecastEl.innerHTML = "";

    dataseries.slice(0,7).forEach(day => {
        const dateStr = String (day.date);
        const date = new Date(
            Number(dateStr.slice(0,4)),
            Number(dateStr.slice(4,6)) -1,
            Number(dateStr.slice(6, 8))
        );

        const dayLabel = date.toLocaleDateString(undefined,{
            weekday:"short",
            month:"short",
            day:"numeric",
        });

        const iconFile = iconMap[day.weather] || "clear.png";

        const highRaw = day.temp2m?.max;
        const lowRaw = day.temp2m?.min;

        const highText = (highRaw === -9999 || highRaw === undefined || highRaw === null) ? "N/A" : `${highRaw}°C`;
        const lowText = (lowRaw === -9999 || lowRaw === undefined || lowRaw === null) ? "N/A" : `${lowRaw}°C`;
        
        const card = document.createElement("article");
        card.className = "forecast-card";


        
        card.innerHTML = `
        <h3>${dayLabel}</h3>
        <p class = "city">${cityName}</p>

        <img class = "weather-icon" src = "images/${iconFile}" alt ="${day.weather}">

        <p class="weather-text">${prettyWeather(day.weather)}</p>

        <div class="temps">
        <span>High: <strong>${highText}</strong></span>
        <span>Low: <strong>${lowText}</strong></span>
        </div>
        `;
        forecastEl.appendChild(card);
    });

}
async function fetchForecast(city){

    setStatus("Loading forecast...");
    forecastEl.innerHTML = "";

    try {
        console.log("Fetching for:", city);

        const url = buildApiUrl(city.lat, city.lon);
        console.log ("URL:", url);

        const resp = await fetch(url);
        console.log("HTTP status:", resp.status);

        const data = await resp.json();
        console.log("data:", data);

        renderForecast(city.name, data.dataseries);
        setStatus("");
    } catch(err){
        console.error(err);
        setStatus("Failed to load forecast data.");
    }
    }
    let cities = [];

    (async function init(){
        try{
            cities = await loadCitiesFromCSV("city_coordinates.csv");
            populateCityDropdown(cities);

            if (cities.length) fetchForecast(cities[0]);}
            catch (err) {
                console.error(err);
                setStatus ("Could not load city list.");
            }
    })();

getForecastBtn.addEventListener("click", () => {
  const city = cities[Number(citySelect.value)];
  if (city) fetchForecast(city);
});

citySelect.addEventListener("change", () => {
  const city = cities[Number(citySelect.value)];
  if (city) fetchForecast(city);
});

