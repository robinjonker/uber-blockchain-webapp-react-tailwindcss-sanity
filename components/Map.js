import { useEffect, useContext } from "react";
import mapboxgl from "mapbox-gl";
import { UberContext } from "../context/uberContext";

const style = {
  wrapper: `flex-1 h-full w-full`,
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const Map = () => {
  const {
    pickupCoordinates,
    dropoffCoordinates,
    departAirCoords,
    arriveAirCoords,
  } = useContext(UberContext);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/drakosi/ckvcwq3rwdw4314o3i2ho8tph",
      center: [-99.29011, 39.39172],
      zoom: 3,
    });

    if (pickupCoordinates) {
      addToMap(map, pickupCoordinates);
      addDepartAir(map, departAirCoords);
    }

    if (dropoffCoordinates) {
      addToMap(map, dropoffCoordinates);
      addAriveAir(map, arriveAirCoords);
    }

    if (pickupCoordinates && dropoffCoordinates) {
      map.fitBounds([dropoffCoordinates, pickupCoordinates], {
        padding: 400,
      });
    }
  }, [pickupCoordinates, dropoffCoordinates, departAirCoords, arriveAirCoords]);

  const addToMap = (map, coordinates) => {
    const marker1 = new mapboxgl.Marker({
      draggable: false,
      scale: "0.5",
    })
      .setLngLat(coordinates)
      .addTo(map);
  };

  const addAriveAir = (map, coordinates) => {
    // Load an image from an external URL.
    map.loadImage(
      "https://upload.wikimedia.org/wikipedia/commons/5/56/Avion_silhouette.png",
      (error, image) => {
        if (error) throw error;
        // Add the image to the map style.
        map.addImage("Arive", image);
        // Add a data source containing one point feature.
        map.addSource("Arive", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: coordinates,
                },
              },
            ],
          },
        });
        // Add a layer to use the image to represent the data.
        map.addLayer({
          id: "Arive",
          type: "symbol",
          source: "Arive", // reference the data source
          layout: {
            "icon-image": "Arive", // reference the image
            "icon-size": 0.1,
          },
        });
      }
    );
  };

  const addDepartAir = (map, coordinates) => {
    // Load an image from an external URL.
    map.loadImage(
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Takeoff.png",
      (error, image) => {
        if (error) throw error;
        // Add the image to the map style.
        map.addImage("Takeoff", image);
        // Add a data source containing one point feature.
        map.addSource("Takeoff", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: coordinates,
                },
              },
            ],
          },
        });
        // Add a layer to use the image to represent the data.
        map.addLayer({
          id: "Takeoff",
          type: "symbol",
          source: "Takeoff", // reference the data source
          layout: {
            "icon-image": "Takeoff", // reference the image
            "icon-size": 0.1,
          },
        });
      }
    );
  };

  return <div className={style.wrapper} id="map" />;
};

export default Map;
