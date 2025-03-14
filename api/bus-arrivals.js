const busConfig = {
    serviceStops: {
        '243W': ['27399'],
        '258': ['27399'],
        '181': ['27431', '22009'],
        '974': ['27101'],
        '243G': ['22009'],
        '811': ['59211', '59159'],
        '811T': ['59211'],
        '861': ['59211', '58541'],
    },
    busStops: {
        '27399': 'B859',
        '27431': 'Koufu',
        '27101': 'Opp WWSS',
        '22009': 'Boon Lay',
        '59211': 'J House',
        '59159': 'YS MRT',
        '58541': 'Opp CB MRT'
    }
};

export const config = {
    runtime: 'edge'
};

export default async function handler(request) {
    if (request.method !== 'GET') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { 
                status: 405, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                } 
            }
        );
    }

    try {
        const uniqueStops = new Set(
            Object.values(busConfig.serviceStops).flat()
        );

        const promises = Array.from(uniqueStops).map(stopCode => 
            fetch(`https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${stopCode}`, {
                headers: {
                    'AccountKey': process.env.LTA_API_KEY,
                    'Accept': 'application/json'
                }
            }).then(res => res.json())
        );

        const responses = await Promise.all(promises);
        
        const allServices = [];
        responses.forEach((response, index) => {
            const stopCode = Array.from(uniqueStops)[index];
            const services = response.Services || [];
            
            services.forEach(service => {
                const relevantStops = busConfig.serviceStops[service.ServiceNo];
                if (relevantStops && relevantStops.includes(stopCode)) {
                    allServices.push({
                        ...service,
                        BusStopName: busConfig.busStops[stopCode],
                        BusStopCode: stopCode
                    });
                }
            });
        });

        return new Response(
            JSON.stringify({ Services: allServices }),
            { 
                status: 200, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                } 
            }
        );
    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch bus timings' }),
            { 
                status: 500, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                } 
            }
        );
    }
}
