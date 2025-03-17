# ubike_2d_3d_map

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### 客製化底圖

啟動docker desktop
在路徑中有mbtile的情況，開啟一個新的terminal並輸入以下docker指令，即可開始使用tileserver提供wmts的服務

```
docker run --rm -it -v ${PWD}:/data -p 8082:8080 maptiler/tileserver-gl --file zoom12-18.mbtiles
```
