export const configGeoserver = {
    // geoserverURL: 'http://localhost:8080/geoserver/',
    geoserverURL: 'https://157.66.81.26:8081/geoserver/',
    
    workspace: 'dulieumau'
}

export const configMap = {
    latlogView: [16.111215, 107.890081],
    zoomView: 6
}

export const listLayerGeovr = [
    {
        displayName: "Lớp DNA",
        layerName: "dna",
        zIndex: 15,
        description: "Lớp dữ liệu dạng vùng khu vực Đông Nam Á",
        layerType: "Polygon",
    },
    {
        displayName: "Lớp Giao Thông",
        layerName: "giaothong",
        zIndex: 12,
        description: "Lớp dữ liệu dạng đường giao thông Việt Nam",
        layerType: "Polyline",
    },
    {
        displayName: "Lớp Places",
        layerName: "places",
        zIndex: 10,
        description: "Lớp dữ liệu dạng điểm",
        layerType: "Point",
    },
    {
        displayName: "Lớp Sông Hồ",
        layerName: "songho",
        zIndex: 12,
        description: "Lớp dữ liệu dạng đường",
        layerType: "Polyline",
    }
];

export const geovrBasemapConfig = {
    displayName: "Bản đồ nền GeoVR",
    layerName: "geovrMap",
}

export const listLayerMap= [
    {
        displayName: "DNA",
        layerName: "dna",
        zIndex: 15,
        description: "Lớp dữ liệu dạng vùng khu vực Đông Nam Á",
        layerType: "polygon",
    },
    {
        displayName: "Giao Thông",
        layerName: "giaothong",
        zIndex: 12,
        description: "Lớp dữ liệu dạng đường giao thông Việt Nam",
        layerType: "polyline",
    },
    {
        displayName: "Places",
        layerName: "places",
        zIndex: 10,
        description: "Lớp dữ liệu dạng điểm",
        layerType: "point",
        searchName: "name_sv"
    },
    {
        displayName: "Sông Hồ",
        layerName: "songho",
        zIndex: 12,
        description: "Lớp dữ liệu dạng đường",
        layerType: "polygon",
    },
    {
        displayName: "Upload Excel",
        layerName: "gisApp_placetest",
        zIndex: 10,
        description: "Lớp dữ liệu dạng điểm",
        layerType: "point",
    }
];

export const searchNameLayer = {
    'dna': 'name_en',
    'giaothong': 'loaiduong',
    'places': 'name_sv',
    'songho': 'ten'
};

export const configAPI = {
    // backendAPI: 'http://localhost:8011/',
    // backendAPI: 'http://157.66.81.26:8000/',
    backendAPI: 'https://157.66.81.26:8000/',
    // frontendAPI: 'http://127.0.0.1:5500/frontend'
}