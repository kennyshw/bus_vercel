const axios = require('axios');

// Enhanced configuration mapping services to their relevant stops
const config = {
    serviceStops: {
        '243W': ['27399'],
        '258': ['27399'],
        '181': ['27431', '22009'],
        '974': ['27101'],
        '243G': ['22009'],
        '811': ['59211', '59159'],
        '811T': ['59211'],
        '861': ['59211', '58541'],
        '965': ['59261'],
        '901M': ['46779', '46759', '47491', '47499']
    },
    busStops: {
        '27399': 'B859',
        '27431': 'Koufu',
        '27101': 'O. WWSS',
        '22009': 'Boon Lay',
        '59211': 'J House',
        '59261': 'B174',
        '46779': 'Adm MRT',
        '46759': '676A',
        '47491': 'Twin F',
        '47499': 'ASM',
        '59159': 'YS MRT',
        '58541': 'O. CB MRT'
    }
};

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const uniqueStops = new Set(
            Object.values(config.serviceStops).flat()
        );

        const promises = Array.from(uniqueStops).map(stopCode => 
            axios.get(`https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${stopCode}`, {
                headers: {
                    'AccountKey': process.env.LTA_API_KEY
                }
            })
        );

        const responses = await Promise.all(promises);
        
        const allServices = [];
        responses.forEach((response, index) => {
            const stopCode = Array.from(uniqueStops)[index];
            const services = response.data.Services || [];
            
            services.forEach(service => {
                const relevantStops = config.serviceStops[service.ServiceNo];
                if (relevantStops && relevantStops.includes(stopCode)) {
                    allServices.push({
                        ...service,
                        BusStopName: config.busStops[stopCode],
                        BusStopCode: stopCode
                    });
                }
            });
        });

        return res.status(200).json({ Services: allServices });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to fetch bus timings' });
    }
}
