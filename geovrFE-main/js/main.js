import {configGeoserver, configMap, geovrBasemapConfig, listLayerGeovr, listLayerMap, searchNameLayer, configAPI} from './config.js';

// -------------------------- //
var _wfsLayers = {};
var _wmsLayers = {};
const _baseMapHTML = `
  <div class="basemap-content">
    <h2 class="fs-2 fw-bold">Base Maps</h2>
    <div class="list-base-map">
      <!-- OSM Base Map -->
      <div class="position-relative mb-1 list-base-map-item" id="osm-container">
        <label for="list-base-map-0" class="d-block">
          <img src="./assets/osmImg.png" alt="OSM" class="img-fluid img-listBaseMap">
          <input type="radio" class="btn-check" name="input-listBaseMap" id="list-base-map-0" autocomplete="off">
          <span class="span-listBaseMap">OSM</span>
        </label>
      </div>

      <!-- GeoVR Base Map -->
      <div class="position-relative list-base-map-item active" id="geovr-container">
        <label for="list-base-map-1" class="d-block">
          <img src="./assets/geovrImg.png" alt="GeoVR" class="img-fluid img-listBaseMap">
          <input type="radio" class="btn-check" name="input-listBaseMap" id="list-base-map-1" autocomplete="off">
          <span class="span-listBaseMap">GeoVR</span>
        </label>
      </div>
    </div>
  </div>
  <hr>
`;
// -------------END------------- //



// -------------------------- //
// Khởi tạo bản đồ
var map = L.map('map', {
    crs: L.CRS.EPSG4326,
    center: configMap.latlogView,
    zoom: configMap.zoomView
});  
map.attributionControl.setPrefix('GeoVR map');
// -------------END------------- //



// -------------------------- //
// Draw
var drawControl = new L.Control.Draw({
    draw: {
        marker: true,  // Cho phép vẽ điểm
        polyline: true,  // Cho phép vẽ đường
        polygon: true,  // Cho phép vẽ vùng
        rectangle: false,  // Không cho phép vẽ hình chữ nhật
        circle: false  // Không cho phép vẽ hình tròn
    },
    edit: {
        featureGroup: new L.FeatureGroup(),  // Nhóm các đối tượng được vẽ
        remove: true  // Cho phép xóa các đối tượng vẽ
    }
});
map.addControl(drawControl);
// Tạo lớp để lưu trữ các đối tượng đã vẽ
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    var layerType = event.layerType;
    var featureGeom = null;

    drawnItems.addLayer(layer);

    var layerName = window.currentLayerName || 'Không xác định';

    // Thông báo loại đối tượng vừa vẽ
    if (layerType === 'marker') {
        var latlng = layer.getLatLng();
        featureGeom = {
            "type": "MultiPoint",
            "coordinates": [[latlng.lng, latlng.lat]]
        };
    } else if (layerType === 'polyline') {
        var latlngs = layer.getLatLngs();
        featureGeom = {
            "type": "MultiLineString",
            "coordinates": [latlngs.map(latlng => [latlng.lng, latlng.lat])]
        };
    } else if (layerType === 'polygon') {
        var latlngs = layer.getLatLngs();
        let coords = latlngs[0]; 
        coords.push(coords[0]);
        featureGeom = {
            "type": "MultiPolygon",
            "coordinates": [[coords.map(latlng => [latlng.lng, latlng.lat])]]
        };
    }
    func__addFeature(layerName, featureGeom);
});

function func__addFeature(layerName, featureGeom) {
    let layerFieldsAPI = `${configAPI.backendAPI}api/gis/table-fields/${layerName}/`;
    fetch(layerFieldsAPI)
    .then(response => response.json())
    .then(fieldsData => {
        const popupContent = func__createFormCreateFeature(fieldsData, layerName);
        document.getElementById('popup-addFeature-body').innerHTML = popupContent;
        document.getElementById('popup-addFeature').classList.remove('hidden');

        // Gắn sự kiện submit form để gửi dữ liệu
        // func__addFeatureFormEvent(layerName, featureGeom);
        
        document.getElementById('popup-addFeature-body').addEventListener('submit', function(event) {
            event.preventDefault();
            console.log(document.getElementById('form-addFeature'));
            const formData = new FormData(document.getElementById('form-addFeature'));
            formData.append('geom', JSON.stringify(featureGeom));
            
            let layerAPI = `${configAPI.backendAPI}api/gis/${layerName}/`;
            fetch(layerAPI, {
                method: 'POST',
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                alert("Thêm dữ liệu thành công!");
                document.getElementById('popup-addFeature').classList.add('hidden');
                func__clearDrawnItems();
                func__refreshLayer(layerName);
            })
            .catch(error => console.error('Lỗi khi gửi dữ liệu:', error));
        });
    })
        .catch(error => console.error('Lỗi khi lấy dữ liệu từ API:', error));
}
function func__createFormCreateFeature(fieldsData, layerName){
    let formContent = `<form id="form-addFeature">`;
    fieldsData.fields.forEach(field => {
        let fieldName = field[0];
        let fieldType = field[1];

        if (fieldName.toLowerCase() !== 'geom' && fieldName.toLowerCase() !== 'id') {
            formContent += `<div class="form-group mb-3">`;

            formContent += `<label for="${fieldName}">${fieldName}:</label>`;

            if (fieldType === 'integer' || fieldType === 'bigint') {
                formContent += `<input type="number" id="${fieldName}" name="${fieldName}" class="form-control" placeholder="Nhập ${fieldName}">`;
            } else if (fieldType === 'numeric') {
                formContent += `<input type="number" step="0.01" id="${fieldName}" name="${fieldName}" class="form-control" placeholder="Nhập ${fieldName}">`;
            } else if (fieldType === 'character varying') {
                formContent += `<input type="text" id="${fieldName}" name="${fieldName}" class="form-control" placeholder="Nhập ${fieldName}">`;
            }

            formContent += `</div>`;
        }
    });

    formContent += `<button type="submit" class="btn btn-primary">Gửi dữ liệu</button>`;
    formContent += `</form>`;

    return formContent;
}
function func__clearDrawnItems() {
    drawnItems.clearLayers(); 
}
function func__refreshLayer(layerName) {
    func__removeLayer(_wfsLayers, layerName);
    func__createWFSLayer(layerName);
}
// -------------END------------- //



// -------------------------- //
var tooltipsState = {
    "btn-layers-tooltips": false,
    "btn-info-tooltips": false,
    "btn-share-tooltips": false
}
// Khởi tạo tooltips
L.Control.Tooltip1 = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

        // Đặt HTML cho container
        container.innerHTML = `
            <div class="custom-tooltip-item" label="Zoom In" id="btn-zoomIn-tooltips">
                <img src="./assets/zoom-in-tooltips.svg" alt="Zoom In" class="custom-rounded-top-left">
            </div>
            <div class="custom-tooltip-item" label="Zoom Out">
                <img src="./assets/zoom-out-tooltips.svg" alt="Zoom Out" id="btn-zoomOut-tooltips">
            </div>
            <div class="custom-tooltip-item" label="Show My Location" id="btn-showMyLocation-tooltips">
                <img src="./assets/location-tooltips.svg" alt="Show My Location" class="custom-rounded-bottom-left">
            </div>

            <div class="custom-tooltip-item mt-2" label="Layers" id="btn-layers-tooltips">
                <img src="./assets/layer-tooltips.svg" alt="Layers" class="custom-rounded-top-left">
            </div>
            <div class="custom-tooltip-item" label="Info" id="btn-info-tooltips">
                <img src="./assets/info-tooltips.svg" alt="Info">
            </div>
            <div class="custom-tooltip-item" label="Share" id="btn-share-tooltips">
                <img src="./assets/share-tooltips.svg" alt="Share" class="custom-rounded-bottom-left">
            </div>
        `;

        // Ngăn chặn sự kiện click từ lan truyền lên bản đồ
        L.DomEvent.disableClickPropagation(container);

        let btn__zoomIn = container.querySelector('#btn-zoomIn-tooltips');
        L.DomEvent.on(btn__zoomIn, 'click', function() {
            map.zoomIn();
        });
        let btn__zoomOut = container.querySelector('#btn-zoomOut-tooltips');
        L.DomEvent.on(btn__zoomOut, 'click', function() {
            map.zoomOut();  
        });
        let btn__showMyLocation = container.querySelector('#btn-showMyLocation-tooltips');
        L.DomEvent.on(btn__showMyLocation, 'click', func__showMyLocation_click);
        let btn__layers = container.querySelector('#btn-layers-tooltips');
        L.DomEvent.on(btn__layers, 'click', func__layers_click);
        let btn__info = container.querySelector('#btn-info-tooltips');
        L.DomEvent.on(btn__info, 'click', func__info_click);

        return container;
    }
});

L.control.tooltip = function (opts) {
    return new L.Control.Tooltip1(opts);
}
L.control.tooltip({
    position: 'topright'
}).addTo(map);


// Các hàm trong tooltips
function func__showMyLocation_click() {
    map.locate({ setView: true, maxZoom: 16 });

    map.on('locationfound', function (e) {
        var radius = 30;
        L.marker(e.latlng).addTo(map)
            .bindPopup("Bạn đang ở trong phạm vi " + radius + " mét tính từ điểm này").openPopup();

        L.circle(e.latlng, radius).addTo(map);
    });

    map.on('locationerror', function () {
        alert("Location access denied.");
    });
}
function func__layers_addEvent() {    
    // -------------------------- //
    // Xử lý basemap
    document.addEventListener('DOMContentLoaded', function () {
        var osmContainer = document.getElementById('osm-container');
        var geovrContainer = document.getElementById('geovr-container');

        osmContainer.addEventListener('click', function () {
            func__selectBasemap('osm');
        });

        geovrContainer.addEventListener('click', function () {
            func__selectBasemap('geovr');
        });

        function func__selectBasemap(basemap) {
            osmContainer.classList.remove('active');
            geovrContainer.classList.remove('active');
            
            if (basemap === 'osm') {
                map.removeLayer(geovrBaseMap);
                osmMap.addTo(map);
                osmContainer.classList.add('active');
            } else if (basemap === 'geovr') {
                map.removeLayer(osmMap);
                geovrBaseMap.addTo(map);
                geovrContainer.classList.add('active');
            }
        }
    });
    // -------------END------------- //


    // -------------------------- //
    // Xử lý layermap
    const layerItems = document.querySelectorAll('.list-layer-map-item');
    layerItems.forEach(function(layer) {
        layer.addEventListener('click', function(e) {
            const checkbox = this.querySelector('.btn-check');
            const layerName = this.getAttribute('data-name');
            const addButton = this.querySelector('.btn-layerAction-addData');
            
            if (e.target.tagName !== 'BUTTON') {
                checkbox.checked = !checkbox.checked; 
                if (checkbox.checked) {
                    this.classList.add('active');
                    func__createWFSLayer(layerName);
                    addButton.disabled = false;
                } else {
                    this.classList.remove('active');
                    func__removeLayer(_wfsLayers, layerName);
                    addButton.disabled = true;
                }
            }

        });
    });
    document.querySelectorAll('.btn-layerAction-showTable').forEach(function(button) {
        button.addEventListener('click', function() {
            var parentItem = this.closest('.list-layer-map-item');
            var layerName = parentItem.getAttribute('data-name');
            
            let endpointAPI = `api/gis/${layerName}/`;
            let layerAPI = `${configAPI.backendAPI}${endpointAPI}`;
            let layerFieldsAPI = `${configAPI.backendAPI}api/gis/table-fields/${layerName}/`;

            fetch(layerFieldsAPI)
            .then(response => response.json())
            .then(fieldsData => {
                const fields = {
                    "fields": fieldsData.fields.map(field => field[0])
                };
                fetch(layerAPI)
                    .then(response => response.json())
                    .then(data => {
                        const popupContent = func__createPopupContent(data, fields, layerName);
                        document.getElementById('popup-body').innerHTML = popupContent;
                        document.getElementById('popup').classList.remove('hidden');
                    })
                    .catch(error => console.error('Lỗi khi lấy dữ liệu từ API:', error));
            })
            .catch(error => console.error('Lỗi khi lấy danh sách các trường từ API:', error));
        });
    });
    document.querySelectorAll('.btn-layerAction-downTable').forEach(function(button) {
        button.addEventListener('click', function() {
            var parentItem = this.closest('.list-layer-map-item');
            var layerName = parentItem.getAttribute('data-name');
            
            let endpointAPI = `api/gis/export-table/${layerName}/`;
            let exportAPI = `${configAPI.backendAPI}${endpointAPI}`;

            fetch(exportAPI)
            .then(response => {
                console.log(response)
                if (!response.ok) {
                    throw new Error('Có lỗi xảy ra' + response.statusText);
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo một URL cho Blob và kích hoạt tải xuống
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${layerName}.xlsx`;  // Tên tệp tin sẽ được tải xuống
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);  // Giải phóng URL
            })
            .catch(error => {
                console.error('Lỗi khi tải dữ liệu:', error);
            });
        });
    });
    document.querySelectorAll('.btn-layerAction-addData').forEach(button => {
        button.addEventListener('click', function () {
            var parentItem = this.closest('.list-layer-map-item');
            var layerName = parentItem.getAttribute('data-name');
            var layerType = this.getAttribute('data-layertype');
    
            // Kiểm tra loại đối tượng và kích hoạt chức năng vẽ tương ứng
            if (layerType === 'point') {
                var drawMarker = new L.Draw.Marker(map);
                drawMarker.enable();  // Kích hoạt vẽ điểm
            } else if (layerType === 'polyline') {
                var drawPolyline = new L.Draw.Polyline(map);
                drawPolyline.enable();  // Kích hoạt vẽ đường
            } else if (layerType === 'polygon') {
                var drawPolygon = new L.Draw.Polygon(map);
                drawPolygon.enable();  // Kích hoạt vẽ vùng
            }


            // Lưu tên lớp đang được vẽ vào một biến toàn cục hoặc đối tượng liên quan
            window.currentLayerName = layerName;
        });
    });

    document.querySelectorAll('.btn-layerAction-importExcel').forEach(function(button) {
        button.addEventListener('click', function() {
            var parentItem = this.closest('.list-layer-map-item');
            var layerName = parentItem.getAttribute('data-name');

            let endpointAPI = `api/gis/import-excel-placetest/${layerName}/`;
            let importAPI = `${configAPI.backendAPI}${endpointAPI}`;

            Swal.fire({
                title: 'Thêm dữ liệu điểm từ Excel',
                html: `
                    <input type="file" id="file-input" accept=".xlsx, .xls" />
                `,
                showCancelButton: true,
                confirmButtonText: 'Thêm dữ liệu',
                cancelButtonText: 'Hủy',
                preConfirm: () => {
                    const fileInput = document.getElementById('file-input');
                    const file = fileInput.files[0];
                    if (!file) {
                        Swal.showValidationMessage('Vui lòng chọn 1 file!');
                    }
                    return file;
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const file = result.value;
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    fetch(importAPI, {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Success:', data);
                        Swal.fire('Success!', data.message, 'success');
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                        Swal.fire('Error!', 'Thêm file thất bại!.', 'error');
                    });
                }
            });
        });
    });
    document.querySelectorAll('.btn-layerAction-deleteAll').forEach(function(button) {
        button.addEventListener('click', function() {
            var parentItem = this.closest('.list-layer-map-item');
            var layerName = parentItem.getAttribute('data-name');


            Swal.fire({
                title: 'Xóa toàn bộ đối tượng',
                text: `Bạn có chắc chắn muốn xóa toàn bộ đối tượng trong lớp "${layerName}" không?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Xóa',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed) {
                    let endpointAPI = `api/gis/${layerName}/delete-all/`;
                    let deleteAPI = `${configAPI.backendAPI}${endpointAPI}`;
    
                    fetch(deleteAPI, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Có lỗi xảy ra khi xóa đối tượng');
                        }
                        return response.json(); 
                    })
                    .then(data => {
                        Swal.fire('Thành công!', data.message, 'success');
                    })
                    .catch((error) => {
                        Swal.fire('Lỗi!', 'Đã xảy ra lỗi khi xóa đối tượng.', 'error');
                    });
                }
            });
        });
    });
}
function func__layersInit() {
    document.getElementById('layers-content-id').hidden = false;
    document.getElementById('info-content-id').hidden = true;

    let layerMapHTML = `
        <div class="layermap-content">
            <h2 class="fs-2 fw-bold">Layers</h2>
            <div class="list-layer-map">
                ${listLayerMap.map(layerConfig => `
                    <div class="position-relative list-layer-map-item mt-2" id="${layerConfig.layerName}-layer" data-name="${layerConfig.layerName}">
                        <img src="./assets/images/${layerConfig.layerName}-layer.png" alt="${layerConfig.layerName}" class="img-fluid img-listLayerMap">
                        <input type="checkbox" class="btn-check" name="input-listLayerMap" id="${layerConfig.layerName}-checkbox" autocomplete="off">
                        <span class="span-listBaseMap">${layerConfig.displayName}</span>
                        <div class="layer-action ms-1">
                            <button class="layer-action-list btn-sm bg-primary border-0 text-white btn-layerAction-showTable">Bảng dữ liệu</button>
                            <button class="layer-action-list btn-sm bg-primary border-0 text-white btn-layerAction-addData" disabled data-layertype="${layerConfig.layerType}">Thêm dữ liệu</button>
                            <button class="layer-action-list btn-sm bg-primary border-0 text-white btn-layerAction-downTable">Tải dữ liệu</button>
                            ${layerConfig.layerName === 'gisApp_placetest' ? `
                                <button class="layer-action-list btn-sm bg-success border-0 text-white btn-layerAction-importExcel">Import Excel</button>
                                <button class="layer-action-list btn-sm bg-danger border-0 text-white btn-layerAction-deleteAll">Xóa toàn bộ</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const container = document.getElementById('layers-content-id');
    const combinedHTML = `
        ${_baseMapHTML}
        ${layerMapHTML}
    `;
    container.innerHTML = combinedHTML;
}
function func__layers_click() {
    func__layersInit();
    func__layers_addEvent();
    func__updateTooltipState('btn-layers-tooltips');
}
function func__info_click() {
    document.getElementById('info-content-id').hidden = false;
    document.getElementById('layers-content-id').hidden = true;
    func__updateTooltipState('btn-info-tooltips');
}

function func__updateTooltipState(clickedId) {
    var sidebar = document.getElementById('sidebar');

    var currentActiveTooltip = Object.keys(tooltipsState).find(key => tooltipsState[key] === true);
    if (currentActiveTooltip === clickedId && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        document.getElementById(clickedId).classList.remove('active');
        tooltipsState[clickedId] = false; 
    } else {
        if (currentActiveTooltip && currentActiveTooltip !== clickedId) {
            tooltipsState[currentActiveTooltip] = false;
            document.getElementById(currentActiveTooltip).classList.remove('active');
        }
        tooltipsState[clickedId] = true;
        document.getElementById(clickedId).classList.add('active');
        sidebar.classList.add('active');
    }
}
document.querySelector('.btn-closeSidebar').addEventListener('click', function() {
    document.getElementById('sidebar').classList.remove('active');
    for (var key in tooltipsState) {
        tooltipsState[key] = false;
        document.getElementById(key).classList.remove('active');
    }
});
// -------------END------------- //



// -------------------------- //
// Tạo các lớp nền (base layers)
var osmMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

// var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
//     maxZoom: 20,
//     subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
//     attribution: 'Map data &copy; <a href="https://www.google.com/maps">Google</a>'
// });

// Tạo lớp nền bằng dữ liệu geovr

// var geovrLayers = [];
// listLayerGeovr.forEach(function (layerConfig) {
//     var wmtsLayer = L.tileLayer(`${configGeoserver.geoserverURL}gwc/service/wmts?service=WMTS&request=GetTile&version=1.0.0&layer=${configGeoserver.workspace}:${layerConfig.layerName}&style=&tilematrixSet=EPSG:4326&format=image/png&tilematrix=EPSG:4326:{z}&tilerow={y}&tilecol={x}`, {
//         tileSize: 256,
//         attribution: '&copy; GeoServer WMTS',
//         opacity: 0.7
//     });
//     geovrLayers.push(wmtsLayer);
// });
// var geovrGroup = L.layerGroup(geovrLayers);
// geovrGroup.addTo(map);

var geovrBaseMap =  L.tileLayer(`${configGeoserver.geoserverURL}gwc/service/wmts?service=WMTS&request=GetTile&version=1.0.0&layer=${configGeoserver.workspace}:${geovrBasemapConfig.layerName}&style=&tilematrixSet=EPSG:4326&format=image/png&tilematrix=EPSG:4326:{z}&tilerow={y}&tilecol={x}`, {
    tileSize: 256,
    attribution: '&copy; GeoServer WMTS',
    opacity: 0.7
});
geovrBaseMap.addTo(map);

// Thêm lớp OSM vào bản đồ mặc định
// osmMap.addTo(map);

// Tạo danh sách các lớp nền
// var baseLayers = {
//     "OSM Map": osmMap,
//     "Google Satellite": googleSat
// };
// -------------END------------- //



// -------------------------- //
// Tạo danh sách các lớp overlay (tầng phủ)
function func__createWFSLayer(layerName) {
    var wfsUrl = `${configGeoserver.geoserverURL}${configGeoserver.workspace}/ows?` +
        `service=WFS&version=1.0.0&request=GetFeature&` +
        `typeName=${configGeoserver.workspace}:${layerName}&` +
        `outputFormat=application/json`;
    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var wfsLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    layer.on('click', function (e) {
                        var properties = feature.properties;
                        L.popup()
                            .setLatLng(e.latlng)
                            .setContent(
                                `<strong class="fs-6 fw-bold">Thông tin:</strong><br>` +
                                func__formatProperties(properties)
                            )
                            .openOn(map);
                    });
                }
            });
            // return wfsLayer;

            _wfsLayers[layerName] = wfsLayer.addTo(map);
        })
    .catch(error => console.error('Lỗi khi lấy dữ liệu', error));
}

function func__createWMSLayer(layerName){
    var layer = L.tileLayer.wms(`${configGeoserver.geoserverURL}${configGeoserver.workspace}/wms`, {
        format: "image/png",
        transparent: true,
        layers: `${configGeoserver.workspace}:${layerConfig.layerName}`,
        zIndex: layerConfig.zIndex || 10,
    });
    return layer;
}

function func__removeLayer(layerList, layerName) {
    if (layerList[layerName]) {
        map.removeLayer(layerList[layerName]); 
        delete layerList[layerName]; 
    }
}

/*
var overlayLayers = {};
listLayerGeovr.forEach(function (layerConfig) {
    // Tạo wms
    var layer = L.tileLayer.wms(`${configGeoserver.geoserverURL}${configGeoserver.workspace}/wms`, {
        format: "image/png",
        transparent: true,
        layers: `${configGeoserver.workspace}:${layerConfig.layerName}`,
        zIndex: layerConfig.zIndex || 10,
    });
    overlayLayers[`WMS: ${layerConfig.displayName}`] = layer;

    // Tạo wfs
    var wfsUrl = `${configGeoserver.geoserverURL}${configGeoserver.workspace}/ows?` +
        `service=WFS&version=1.0.0&request=GetFeature&` +
        `typeName=${configGeoserver.workspace}:${layerConfig.layerName}&` +
        `outputFormat=application/json`;
    console.log(wfsUrl)
    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var wfsLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    layer.on('click', function (e) {
                        var properties = feature.properties;
                        L.popup()
                            .setLatLng(e.latlng)
                            .setContent(
                                `<strong>Thông tin:</strong><br>` +
                                func__formatProperties(properties)
                            )
                            .openOn(map);
                    });
                }
            });

            overlayLayers[`WFS: ${layerConfig.displayName}`] = wfsLayer;
            layerControl.addOverlay(wfsLayer, `WFS: ${layerConfig.displayName}`);
        })
        .catch(error => console.error('Lỗi khi lấy dữ liệu', error));
});
*/

// Thêm các lớp vào Layer Control
// var layerControl = L.control.layers(baseLayers, overlayLayers).addTo(map);
// -------------END------------- //



// -------------------------- //
// Click bản đồ
function onMapClick(e) {
    console.log("Clicked: " + e.latlng)
    // getFeatureInfo(e.latlng);
}
map.on("click", onMapClick);
// -------------END------------- //



// -------------------------- //
// Các hàm xử lý bản đồ
function func__getFeatureInfo(latlng) {
    var url = `${configGeoserver.geoserverURL}${configGeoserver.workspace}/wms?` + 
          `service=WMS&version=1.1.1&request=GetFeatureInfo&` + 
          `layers=${configGeoserver.workspace}:layer1,${configGeoserver.workspace}:layer2&` + 
          `query_layers=${configGeoserver.workspace}:layer1,${configGeoserver.workspace}:layer2&` + 
          `bbox=${map.getBounds().toBBoxString()}&` + 
          `width=${map.getSize().x}&height=${map.getSize().y}&` + 
          `srs=EPSG:4326&` + 
          `info_format=application/json&` + 
          `x=${Math.floor(map.latLngToContainerPoint(latlng).x)}&` + 
          `y=${Math.floor(map.latLngToContainerPoint(latlng).y)}`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.features && data.features.length > 0) {
            data.features.forEach(function(feature) {
                var layerName = feature.id.split('.')[0]; // Lấy tên lớp từ ID
                var properties = feature.properties;
                
                L.popup()
                    .setLatLng(latlng)
                    .setContent(
                        `Lớp: ${layerName}<br>` +
                        `Thông tin: ${JSON.stringify(properties)}`
                    )
                    .openOn(map);
            });
        } else {
            console.log("Không có thông tin tại vị trí này");
        }
    })
    .catch(error => console.error('Lỗi khi lấy thông tin đối tượng', error));
}
function func__formatProperties(properties) {
    // Tạo chuỗi HTML với các thuộc tính trên mỗi dòng
    var htmlContent = "";
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            htmlContent += `<strong>${key}:</strong> ${properties[key]}<br>`;
        }
    }
    return htmlContent;
}
// -------------END------------- //



// -------------------------- //
// Xử lý popup
function func__createPopupContent(data, fields, layerName) {
    // Tạo danh sách các trường trừ trường 'geom'
    let filteredFields = fields.fields.filter(field => field !== 'geom');

    let tableHeaders = filteredFields.map(field => {
        return `<th>${field}</th>`;
    }).join('');
    let tableRows = data.map(item => {
        let rowCells = filteredFields.map(field => {
            return `<td>${item[field] !== undefined ? item[field] : 'N/A'}</td>`;
        }).join('');

        return `<tr>${rowCells}</tr>`;
    }).join('');
    return `
    <h4>Bảng dữ liệu lớp: <span class="displayName fs-6 fw-bold">${layerName}<span></h4>
    <table class="table">
        <thead>
            <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
`;
}

// Đóng popup khi nhấn vào nút đóng
document.getElementById('popup-close').addEventListener('click', function() {
    document.getElementById('popup').classList.add('hidden');
});
document.getElementById('popup-addFeature-close').addEventListener('click', function() {
    document.getElementById('popup-addFeature').classList.add('hidden');
    func__clearDrawnItems();
});
// Đóng popup khi nhấn ra ngoài vùng popup
document.getElementById('popup').addEventListener('click', function(event) {
    if (event.target === this) {
        this.classList.add('hidden');
    }
});
// document.getElementById('popup-addFeature').addEventListener('click', function(event) {
//     if (event.target === this) {
//         this.classList.add('hidden');
//     }
// });
// -------------END------------- //



// -------------------------- //
// Xử lý tìm kiếm
const mapSearch = document.querySelector('.map--search');
// Vô hiệu hóa sự kiện vào bản đồ khi nhấn vào tìm kiếm
L.DomEvent.disableClickPropagation(mapSearch);

document.getElementById("button-search").addEventListener("click", function() {
    const searchValue = document.getElementById("input-search").value.trim();
    if (searchValue !== "") {
        func__searchAndZoomToFeature(searchValue);
    } 
});

function func__searchAndZoomToFeature(searchValue) {
    let results = {};
    if(!_wfsLayers.length) {
        for (let layerName in _wfsLayers) {
            if (_wfsLayers.hasOwnProperty(layerName)) {
                let wfsLayer = _wfsLayers[layerName];
    
                if (wfsLayer) {
                    let foundFeatures = []; 
    
                    wfsLayer.eachLayer(function (layer) {
                        let properties = layer.feature.properties;
                        let searchProperty = searchNameLayer[layerName]; 
    
                        // Kiểm tra thuộc tính có chứa giá trị tìm kiếm không
                        if (properties[searchProperty] == searchValue) {
                            foundFeatures.push(layer); 
                        }
                    });
    
                    // Nếu tìm thấy ít nhất một đối tượng trong lớp, lưu kết quả
                    if (foundFeatures.length > 0) {
                        results[layerName] = foundFeatures;
                    }
                }
            };
        };
        if (Object.keys(results).length > 0) {
            console.log("Kết quả tìm kiếm:", results);
            
            for (let layerName in results) {
                if (results.hasOwnProperty(layerName)) {
                    let features = results[layerName];
                    if (features.length > 0) {
                        // latLngBounds để combine các bound
                        let bounds = L.latLngBounds(features.map(feature => feature.getBounds()));
                        map.fitBounds(bounds);
                    }
                }
            }
        } else {
            alert("Không tìm thấy đối tượng nào!");
        }
    } else {
        alert("Không có lớp nào được hiển thị để tìm kiếm !");
    }
}
// -------------END------------- //