type Params =
  | {
      fromOrTo: "from";
      placename: string;
      osm_key: "place";
    }
  | {
      fromOrTo: "to";
      placename: string;
      osm_key: "place" | "historic" | "tourism";
    };

export const photonRequestFunction = async (params: Params) => {
  if (params.fromOrTo === "from") {
  } else if (params.fromOrTo === "to") {
  } else return null;
};

const photonUrlString = `https://photon.komoot.io/api/?q=amravati&limit=5&osm_tag=place:city&osm_tag=place:state&osm_tag=place:village&osm_tag=place:town&osm_tag=place:country&osm_tag=historic&osm_tag=tourism&lang=en`;
