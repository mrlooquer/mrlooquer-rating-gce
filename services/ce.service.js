const API = require('./api.service');
const debug = require('debug')('ml-rating:ce');
const Compute = require('@google-cloud/compute');

module.exports = function () {

    async function getVM(instanceZone, instanceId) {
        debug('Getting vm with id ' + instanceId + ' of zone ' + instanceZone);
        const compute = new Compute();
        const zone = compute.zone(instanceZone);
        try {
            const vm = await new Promise((resolve, reject) => {
                zone.getVMs({
                    filter: `id eq ${instanceId}`
                }, function (err, vms) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!vms || vms.length === 0) {
                        reject(new Error('VM not found'));
                    }
                    resolve(vms[0]);
                    return;
                })
            });
            return vm;

        } catch (err) {
            debug('Error obtaining vm', err);
            throw new Error('VM not found');
        }

    }



    async function createMachine(event) {
        debug('New machine event');
        const vm = await getVM(event.jsonPayload.resource.zone, event.jsonPayload.resource.id);
        debug('vm');
        debug(JSON.stringify(vm));
        if (vm && vm.metadata && vm.metadata.networkInterfaces && vm.metadata.networkInterfaces.length > 0) {
            const tags = [];
            tags.push('instanceId: ' + vm.metadata.id);
            tags.push('zone: ' + event.jsonPayload.resource.zone);
            tags.push('name:' + vm.metadata.name);
            tags.push('GCE')
            if (vm.metadata.labels) {
                const keys = Object.keys(vm.metadata.labels);
                keys.forEach(key => {
                    if (key.startsWith('ml-')) {
                        tags.push(`${key}:${vm.metadata.labels[key]}`);
                    }
                });
            }
            debug('Tags: ', tags);
            let ip = null;
            if (vm.metadata.networkInterfaces[0] && vm.metadata.networkInterfaces[0].accessConfigs && vm.metadata.networkInterfaces[0].accessConfigs.length > 0) {
                ip = vm.metadata.networkInterfaces[0].accessConfigs[0].natIP;
            }
            if (!ip) {
                debug('No IP');
                return;
            }

            await API.createAsset(ip, tags);
        }
    }


    async function treatEvent(event) {
        debug('Compute Engine event ' + event.jsonPayload.event_type);
        debug(JSON.stringify(event));
        try {
            if (event.jsonPayload.event_type !== 'GCE_OPERATION_DONE') {
                debug('Event not done');
                return;
            }
            await createMachine(event);
        } catch (err) {
            debug('Error treating error', err);
        }
    }

    return {
        treatEvent
    };
}();