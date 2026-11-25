export async function GET() {
    try {
        const infoUrl = "https://api-public.odpt.org/api/v4/gbfs/hellocycling/station_information.json";
        const statusUrl = "https://api-public.odpt.org/api/v4/gbfs/hellocycling/station_status.json";
        const [infoRes, statusRes] = await Promise.all([
            fetch(infoUrl),
            fetch(statusUrl),
        ]);
        if (!infoRes.ok || !statusRes.ok) {
            return Response.json(
                { error: "外部APIからの取得に失敗しました" },
                { status: 502 }
            );
        }
        const [infoGbfs, statusGbfs] = await Promise.all([
            infoRes.json(),
            statusRes.json(),
        ]);

        const statusMap = new Map();
        for (const status of statusGbfs.data.stations) {
            statusMap.set(status.station_id, status);
        }

        const features = [];
        for (const info of infoGbfs.data.stations) {
            const status = statusMap.get(info.station_id);
            if (!status) continue;

            features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [info.lon, info.lat]
                },
                properties: {
        //            i: info.station_id,
                    n: info.name,
                    a: info.address,
                    b: status.num_bikes_available,
                    d: status.num_docks_available,
                }
            });
        }

        const geojson = {
            type: "FeatureCollection",
            features: features
        };



        return Response.json(
            geojson,
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
                },
            },
        );
    } catch (error) {
        console.error(error);
        return Response.json(
            { error: "サーバー内部でエラーが発生しました" },
            { status: 500 }
        );
    }
}
