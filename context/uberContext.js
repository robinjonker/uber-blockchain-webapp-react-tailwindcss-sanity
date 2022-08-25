import { createContext, useState, useEffect } from "react";
import { faker } from "@faker-js/faker";

export const UberContext = createContext();

export const UberProvider = ({ children }) => {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupCoordinates, setPickupCoordinates] = useState();
  const [dropoffCoordinates, setDropoffCoordinates] = useState();
  const [departAirCoords, setDepartAirCoords] = useState();
  const [arriveAirCoords, setArriveAirCoords] = useState();
  const [currentAccount, setCurrentAccount] = useState();
  const [currentUser, setCurrentUser] = useState([]);
  const [selectedRide, setSelectedRide] = useState([]);
  const [price, setPrice] = useState();
  const [basePrice, setBasePrice] = useState();

  let metamask;

  if (typeof window !== "undefined") {
    metamask = window.ethereum;
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (!currentAccount) return;
    requestToGetCurrentUsersInfo(currentAccount);
  }, [currentAccount]);

  useEffect(() => {
    if (!pickupCoordinates || !dropoffCoordinates) return;
    (async () => {
      try {
        const response = await fetch("/api/map/getDuration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pickupCoordinates: `${pickupCoordinates[0]},${pickupCoordinates[1]}`,
            dropoffCoordinates: `${dropoffCoordinates[0]},${dropoffCoordinates[1]}`,
          }),
        });

        const data = await response.json();
        setBasePrice(Math.round(await data.data));
      } catch (error) {
        console.error(error);
      }
    })();
  }, [pickupCoordinates, dropoffCoordinates]);

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return;
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (addressArray.length > 0) {
        setCurrentAccount(addressArray[0]);
        requestToCreateUserOnSanity(addressArray[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return;
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (addressArray.length > 0) {
        setCurrentAccount(addressArray[0]);
        requestToCreateUserOnSanity(addressArray[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const createLocationCoordinatePromise = (locationName, locationType) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch("api/map/getLocationCoordinates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: locationName,
          }),
        });

        const data = await response.json();

        if (data.message === "success") {
          switch (locationType) {
            case "pickup":
              console.log("received pickup cords: ", data.data);
              setPickupCoordinates(data.data);
              nearbyDepart(data.data);
              break;
            case "dropoff":
              setDropoffCoordinates(data.data);
              nearbyArrive(data.data);
              break;
          }
          resolve();
        } else {
          reject();
        }
      } catch (error) {
        console.error(error);
        reject();
      }
    });
  };

  useEffect(() => {
    if (pickup && dropoff) {
      (async () => {
        await Promise.all([
          createLocationCoordinatePromise(pickup, "pickup"),
          createLocationCoordinatePromise(dropoff, "dropoff"),
        ]);
      })();
    } else return;
  }, [pickup, dropoff]);

  // airports
  const cords1 = [-25.939722, 27.924722]; // lanseria
  const cords2 = [-26.133611, 28.242222]; // OR T
  const cords3 = [-29.093889, 26.303889]; // bloem
  const cords4 = [-34.763333, 20.036389]; // struisbaai
  const maxResults = 1;
  const maxDistance = 20000000;

  // function
  const sphereKnn = require("sphere-knn");
  const lookup = sphereKnn([
    /* This array needs to be full of objects that have latitudes and
     * longitudes. Accepted property names are "lat", "latitude", "lon",
     * "lng", "long", "longitude". */
    { lat: cords1[0], lon: cords1[1] },
    { lat: cords2[0], lon: cords2[1] },
    { lat: cords3[0], lon: cords3[1] },
    { lat: cords4[0], lon: cords4[1] },
    /* You can also use an array. */
    //   [my_lat, my_lon],

    //   ...
  ]);

  const nearbyDepart = (data) => {
    const points = lookup(data[1], data[0], maxResults, maxDistance);
    const nearestAirportCords = [points[0].lon, points[0].lat];
    setDepartAirCoords(nearestAirportCords);
  };

  const nearbyArrive = (data) => {
    const points = lookup(data[1], data[0], maxResults, maxDistance);
    const nearestAirportCords = [points[0].lon, points[0].lat];
    setArriveAirCoords(nearestAirportCords);
  };

  const requestToCreateUserOnSanity = async (address) => {
    if (!window.ethereum) return;
    try {
      await fetch("/api/db/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userWalletAddress: address,
          name: faker.name.findName(),
        }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const requestToGetCurrentUsersInfo = async (walletAddress) => {
    try {
      const response = await fetch(
        `/api/db/getUserInfo?walletAddress=${walletAddress}`
      );

      const data = await response.json();
      setCurrentUser(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <UberContext.Provider
      value={{
        pickup,
        setPickup,
        dropoff,
        setDropoff,
        pickupCoordinates,
        setPickupCoordinates,
        dropoffCoordinates,
        setDropoffCoordinates,
        departAirCoords,
        setDepartAirCoords,
        arriveAirCoords,
        setArriveAirCoords,
        connectWallet,
        currentAccount,
        currentUser,
        selectedRide,
        setSelectedRide,
        price,
        setPrice,
        basePrice,
        metamask,
      }}
    >
      {children}
    </UberContext.Provider>
  );
};
