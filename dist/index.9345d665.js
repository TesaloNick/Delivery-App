mapboxgl.accessToken = "pk.eyJ1IjoidGVzYWxvbmljayIsImEiOiJjbDdodmdheHIwaWIyM3VtbTJjaXNreGt2In0.Er4yPKDyLrAYKJn5rRpXoQ";
const urlBase = "https://api.mapbox.com/isochrone/v1/mapbox/";
const lon = 27.55689040736249;
const lat = 53.89733609094718;
let profile = "cycling";
let minutes = 5;
let coordinates = "";
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [
        lon,
        lat
    ],
    zoom: 10
});
async function getIso(lat, lon) {
    const query = await fetch(`${urlBase}${profile}/${lon},${lat}?contours_minutes=${minutes}&polygons=true&access_token=${mapboxgl.accessToken}`, {
        method: "GET"
    });
    const data = await query.json();
    console.log(data);
    await map.getSource("iso").setData(data);
}
let from = document.querySelector(".from");
let inputs = document.querySelector(".inputs");
const geocoderFrom = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: true,
    placeholder: "address"
});
// const geocoderWhere = new MapboxGeocoder({
//   accessToken: mapboxgl.accessToken,
//   mapboxgl: mapboxgl,
//   marker: true,
//   placeholder: 'Where',
// });
// console.log(geocoderWhere, from);
map.addControl(geocoderFrom);
// map.addControl(geocoderWhere);
map.on("load", ()=>{
    map.addSource("iso", {
        type: "geojson",
        data: {
            "type": "FeatureCollection",
            "features": []
        }
    });
    map.addLayer({
        "id": "isoLayer",
        "type": "fill",
        "source": "iso",
        "layout": {},
        "paint": {
            "fill-color": "#5a3fc0",
            "fill-opacity": 0.3
        }
    }, "poi-label");
    map.addSource("single-point", {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    });
    map.addLayer({
        id: "point",
        source: "single-point",
        type: "circle",
        paint: {
            "circle-radius": 10,
            "circle-color": "#448ee4"
        }
    });
    geocoderFrom.on("result", (event)=>{
        const list = document.querySelector(".list__ul");
        const inputName = document.querySelector(".inputs__name");
        const li = document.createElement("li");
        li.dataset.address = event.result.place_name;
        li.innerHTML = inputName.value;
        li.classList.add("list__li");
        list.append(li);
        coordinates = event.result.geometry.coordinates;
        getIso(coordinates[1], coordinates[0]);
    });
    getIso(lat, lon);
    //_______________________
    map.addLayer({
        id: "clearances",
        type: "fill",
        source: {
            type: "geojson",
            data: obstacle
        },
        layout: {},
        paint: {
            "fill-color": "#f03b20",
            "fill-opacity": 0.5,
            "fill-outline-color": "#f03b20"
        }
    });
    map.addSource("theRoute", {
        type: "geojson",
        data: {
            type: "Feature"
        }
    });
    map.addLayer({
        id: "theRoute",
        type: "line",
        source: "theRoute",
        layout: {
            "line-join": "round",
            "line-cap": "round"
        },
        paint: {
            "line-color": "#cccccc",
            "line-opacity": 0.5,
            "line-width": 13,
            "line-blur": 0.5
        }
    });
    // Source and layer for the bounding box
    map.addSource("theBox", {
        type: "geojson",
        data: {
            type: "Feature"
        }
    });
    map.addLayer({
        id: "theBox",
        type: "fill",
        source: "theBox",
        layout: {},
        paint: {
            "fill-color": "#FFC300",
            "fill-opacity": 0.5,
            "fill-outline-color": "#FFC300"
        }
    });
});
//________________________________________________________________________________________________
const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: "metric",
    profile: "mapbox/driving",
    alternatives: false,
    geometries: "geojson",
    controls: {
        instructions: false
    },
    flyTo: false
});
map.addControl(directions, "top-right");
map.scrollZoom.enable();
const clearances = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    -84.47426,
                    38.06673
                ]
            },
            properties: {
                clearance: "13' 2"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    -84.47208,
                    38.06694
                ]
            },
            properties: {
                clearance: "13' 7"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    -84.60485,
                    38.12184
                ]
            },
            properties: {
                clearance: "13' 7"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    -84.61905,
                    37.87504
                ]
            },
            properties: {
                clearance: "12' 0"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    -84.55946,
                    38.30213
                ]
            },
            properties: {
                clearance: "13' 6"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    -84.27235,
                    38.04954
                ]
            },
            properties: {
                clearance: "13' 6"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    -84.27264,
                    37.82917
                ]
            },
            properties: {
                clearance: "11' 6"
            }
        }
    ]
};
const obstacle = turf.buffer(clearances, 0.25, {
    units: "kilometers"
});
let bbox = [
    0,
    0,
    0,
    0
];
let polygon = turf.bboxPolygon(bbox);
let counter = 0;
const maxAttempts = 50;
let emoji = "";
let collision = "";
let detail = "";
const reports = document.getElementById("reports");
function addCard(id, element, clear, detail) {
    const card = document.createElement("div");
    card.className = "card";
    // Add the response to the individual report created above
    const heading = document.createElement("div");
    // Set the class type based on clear value
    heading.className = clear === true ? "card-header route-found" : "card-header obstacle-found";
    heading.innerHTML = id === 0 ? `${emoji} The route ${collision}` : `${emoji} Route ${id} ${collision}`;
    const details = document.createElement("div");
    details.className = "card-details";
    details.innerHTML = `This ${detail} obstacles.`;
    card.appendChild(heading);
    card.appendChild(details);
    element.insertBefore(card, element.firstChild);
}
function noRoutes(element) {
    const card = document.createElement("div");
    card.className = "card";
    // Add the response to the individual report created above
    const heading = document.createElement("div");
    heading.className = "card-header no-route";
    emoji = "\uD83D\uDED1";
    heading.innerHTML = `${emoji} Ending search.`;
    // Add details to the individual report
    const details = document.createElement("div");
    details.className = "card-details";
    details.innerHTML = `No clear route found in ${counter} tries.`;
    card.appendChild(heading);
    card.appendChild(details);
    element.insertBefore(card, element.firstChild);
}
directions.on("clear", ()=>{
    map.setLayoutProperty("theRoute", "visibility", "none");
    map.setLayoutProperty("theBox", "visibility", "none");
    counter = 0;
    reports.innerHTML = "";
});
directions.on("route", (event)=>{
    // Hide the route and box by setting the opacity to zero
    map.setLayoutProperty("theRoute", "visibility", "none");
    map.setLayoutProperty("theBox", "visibility", "none");
    if (counter >= maxAttempts) noRoutes(reports);
    else // Make each route visible
    for (const route of event.route){
        // Make each route visible
        map.setLayoutProperty("theRoute", "visibility", "visible");
        map.setLayoutProperty("theBox", "visibility", "visible");
        // Get GeoJSON LineString feature of route
        const routeLine = polyline.toGeoJSON(route.geometry);
        // Create a bounding box around this route
        // The app will find a random point in the new bbox
        bbox = turf.bbox(routeLine);
        polygon = turf.bboxPolygon(bbox);
        // Update the data for the route
        // This will update the route line on the map
        map.getSource("theRoute").setData(routeLine);
        // Update the box
        map.getSource("theBox").setData(polygon);
        const clear = turf.booleanDisjoint(obstacle, routeLine);
        if (clear === true) {
            collision = "does not intersect any obstacles!";
            detail = `takes ${(route.duration / 60).toFixed(0)} minutes and avoids`;
            emoji = "✔️";
            map.setPaintProperty("theRoute", "line-color", "#74c476");
            // Hide the box
            map.setLayoutProperty("theBox", "visibility", "none");
            // Reset the counter
            counter = 0;
        } else {
            // Collision occurred, so increment the counter
            counter = counter + 1;
            // As the attempts increase, expand the search area
            // by a factor of the attempt count
            polygon = turf.transformScale(polygon, counter * 0.01);
            bbox = turf.bbox(polygon);
            collision = "is bad.";
            detail = `takes ${(route.duration / 60).toFixed(0)} minutes and hits`;
            emoji = "⚠️";
            map.setPaintProperty("theRoute", "line-color", "#de2d26");
            // Add a randomly selected waypoint to get a new route from the Directions API
            const randomWaypoint = turf.randomPoint(1, {
                bbox: bbox
            });
            directions.setWaypoint(0, randomWaypoint["features"][0].geometry.coordinates);
        }
        // Add a new report section to the sidebar
        addCard(counter, reports, clear, detail);
    }
});

//# sourceMappingURL=index.9345d665.js.map
