import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity , ScrollView, Animated, Easing } from 'react-native';

const { width } = Dimensions.get('window');

// ⚠️ CONFIGURACIÓN ESP32 - ACCESS POINT
const ESP32_IP = '192.168.4.1'; // ← IP FIJA del ESP32
const WIFI_SSID = 'Estacionamiento_ESP32';
const WIFI_PASSWORD = '12345678';

export default function HomeScreen() {
  const [lugaresDisponibles, setLugaresDisponibles] = useState(0); 
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);
  const [conectadoWifi, setConectadoWifi] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Función para obtener datos del ESP32
  const obtenerEstadoESP32 = async () => {
    try {
      const response = await fetch(`http://${ESP32_IP}/estado`, {
        method: 'GET',
      });
      
      if (!response.ok) throw new Error('Error en respuesta');
      
      const data = await response.json();
      setLugaresDisponibles(data.disponibles);
      setErrorConexion(false);
      setConectadoWifi(true);
      
    } catch (error) {
      console.log('Error conectando al ESP32:', error);
      setErrorConexion(true);
      setConectadoWifi(false);
    } finally {
      setCargando(false);
    }
  };

  // Actualizar cada 3 segundos
  useEffect(() => {
    obtenerEstadoESP32();
    
    const intervalo = setInterval(obtenerEstadoESP32, 3000);
    
    return () => clearInterval(intervalo);
  }, []);

  // Animación cuando cambian los datos
  useEffect(() => {
    if (!cargando) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [lugaresDisponibles, cargando]);

  // Determinar el estado
  const getEstado = () => {
    if (lugaresDisponibles === 0) return 'critico';
    if (lugaresDisponibles <= 3) return 'advertencia';
    return 'normal';
  };

  const estado = getEstado();

  // Configuraciones por estado
  const configEstados = {
    normal: {
      color: '#4C763B',
      icon: '🚗💨',
      mensaje: 'Disponibilidad buena',
      sombra: '#27ae60'
    },
    advertencia: {
      color: '#FEB21A', 
      icon: '⚠️',
      mensaje: '¡Cuidado! Los lugares están por acabarse',
      sombra: '#e67e22'
    },
    critico: {
      color: '#DC143C',
      icon: '🚫',
      mensaje: '¡Lo sentimos! No hay lugares disponibles',
      sombra: '#c0392b'
    }
  };

  const config = configEstados[estado];

  // Pantalla de instrucciones si no hay conexión
  if (!conectadoWifi && errorConexion) {
    return (
      <View style={styles.container}>
        <Text style={styles.tituloError}>Conectar al WiFi del ESP32</Text>
        
        <View style={styles.pasosContainer}>
          <Text style={styles.paso}>1. Ve a Ajustes → WiFi</Text>
          <Text style={styles.paso}>2. Busca: <Text style={styles.destacado}>{WIFI_SSID}</Text></Text>
          <Text style={styles.paso}>3. Contraseña: <Text style={styles.destacado}>{WIFI_PASSWORD}</Text></Text>
          <Text style={styles.paso}>4. Vuelve a esta app</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.botonReintentar}
          onPress={obtenerEstadoESP32}
        >
          <Text style={styles.botonTexto}>Reintentar Conexión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pantalla de carga
  if (cargando) {
    return (
      <View style={styles.container}>
        <Text style={styles.cargandoTexto}>Buscando ESP32...</Text>
        <Text style={styles.cargandoSubtexto}>Conectando a {ESP32_IP}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        {/* Header con logo */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/estacionamiento-inteligente.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Bienvenido a tu</Text>
          <Text style={styles.subtitle}>Estacionamiento Inteligente</Text>
        </View>

        {/* Icono animado y estado principal */}
        <View style={[styles.statusCard, { backgroundColor: config.color, shadowColor: config.sombra }]}>
          <Text style={styles.icon}>{config.icon}</Text>
          <Text style={styles.availableText}>Lugares Disponibles:</Text>
          {/* Número con animación */}
          <Animated.Text 
            style={[
              styles.number,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {lugaresDisponibles}
          </Animated.Text>
          <Text style={styles.totalText}>de 5 lugares</Text>
          <Text style={styles.mensajeEstado}>{config.mensaje}</Text>
        </View>

        {/* Barra de progreso circular */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill,
                { 
                  height: `${(lugaresDisponibles / 5) * 100}%`,
                  backgroundColor: config.color
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((lugaresDisponibles / 5) * 100)}%
          </Text>
        </View>

        {/* Info de conexión */}
        <View style={styles.infoConexion}>
          <Text style={styles.estadoConexion}>
            {conectadoWifi ? '✅ Conectado al ESP32' : '❌ Sin conexión'}
          </Text>
          <Text style={styles.infoIP}>IP: {ESP32_IP}</Text>
          <TouchableOpacity onPress={obtenerEstadoESP32}>
            <Text style={styles.textoActualizar}>Toca para actualizar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#73C8D2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#73C8D2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    color: 'white',
    marginBottom: 5,
    fontWeight: '300',
  },
  subtitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  statusCard: {
    alignItems: 'center',
    padding: 35,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
    minWidth: width * 0.85,
    marginBottom: 30,
  },
  icon: {
    fontSize: 50,
    marginBottom: 15,
  },
  availableText: {
    fontSize: 20,
    color: 'white',
    marginBottom: 10,
    fontWeight: '600',
  },
  number: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 5,
  },
  totalText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
  },
  mensajeEstado: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    marginVertical: 15,
  },
  progressBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  progressFill: {
    width: '100%',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  progressText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoConexion: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    minWidth: width * 0.85,
  },
  estadoConexion: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoIP: {
    color: 'white',
    fontSize: 14,
    marginBottom: 10,
  },
  textoActualizar: {
    color: 'white',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  // Estilos para pantalla de error
  tituloError: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  pasosContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 25,
    borderRadius: 15,
    marginBottom: 30,
    width: '90%',
  },
  paso: {
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 15,
    lineHeight: 24,
  },
  destacado: {
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  botonReintentar: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  botonTexto: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cargandoTexto: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  cargandoSubtexto: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.8,
  },
});