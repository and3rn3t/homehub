# MQTT Broker Setup

This directory contains the Mosquitto MQTT broker configuration for HomeHub.

## Quick Start

### Start the broker

```powershell
docker-compose up -d mosquitto
```

### Check status

```powershell
docker ps | Select-String mosquitto
```

### View logs

```powershell
docker logs homehub-mosquitto --tail 50 -f
```

### Test connection

```powershell
node scripts/test-mqtt-connection.js
```

### Stop the broker

```powershell
docker-compose down
```

## Configuration

- **MQTT Port**: 1883 (TCP) - For Node.js/backend services
- **WebSocket Port**: 9001 - For browser clients
- **Config File**: `mosquitto/config/mosquitto.conf`

## Security

⚠️ **Development Mode**: Anonymous access is currently enabled for easy development.

Before production deployment:

1. Enable authentication in `mosquitto.conf`
2. Create password file: `mosquitto_passwd -c passwordfile username`
3. Update `.env` with credentials

## Directory Structure

```
mosquitto/
├── config/
│   └── mosquitto.conf   # Broker configuration
├── data/                # Persistent message storage (gitignored)
└── log/                 # Broker logs (gitignored)
```

## Troubleshooting

### Broker won't start

```powershell
# Check Docker is running
docker info

# Check for port conflicts
netstat -ano | findstr "1883\|9001"
```

### Can't connect

```powershell
# Restart broker
docker-compose restart mosquitto

# Check logs for errors
docker logs homehub-mosquitto
```

## Resources

- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [MQTT Protocol](https://mqtt.org/)
- [MQTT.js Client Library](https://github.com/mqttjs/MQTT.js)
