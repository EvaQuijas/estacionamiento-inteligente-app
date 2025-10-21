import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity , ScrollView, Animated, Easing } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';


const { width } = Dimensions.get('window');

//configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBcRioaBdcIONUZxVQA7oasJF8n6ztfRzI",
  authDomain: "estacionamientointeligen-d95f7.firebaseapp.com",
  databaseURL: "https://estacionamientointeligen-d95f7-default-rtdb.firebaseio.com",
  projectId: "estacionamientointeligen-d95f7",
  storageBucket: "estacionamientointeligen-d95f7.firebasestorage.app",
  messagingSenderId: "910187892329",
  appId: "1:910187892329:web:63de446194a62f03465cf8",
  measurementId: "G-N84S4C5CNB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);


export default function HomeScreen() {
  const [lugaresDisponibles, setLugaresDisponibles] = useState(0); // Valor inicial de ejemplo
  const [cargando, setCargando] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);
  const [conectadoWifi, setConectadoWifi] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  //Manejo de datos desde fire
useEffect(() => {
  const estacionamientoRef = ref(database, 'Estacionamiento');
  
  const unsubscribe = onValue(estacionamientoRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Datos de Firebase:', data);
    
    if (data) {
      setLugaresDisponibles(data.lugares_disponibles || 0);
      setConectadoWifi(true);
      setErrorConexion(false);
    }
    setCargando(false);
  }, (error) => {
    console.error('Error Firebase:', error);
    setErrorConexion(true);
    setCargando(false);
  });

  return () => off(estacionamientoRef, 'value', unsubscribe);
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


  // Pantalla de carga
  if (cargando) {
    return (
      <View style={styles.container}>
        <Text style={styles.cargandoTexto}>Cargando datos...</Text>
        <Text style={styles.cargandoSubtexto}>Buscando sensores</Text>
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
    justifyContent: 'flex-start', // Cambiado de 'center' a 'flex-start'
    paddingVertical: 20, // Reducido el padding vertical
 // Aseguramos que ocupe toda la altura
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
    justifyContent: 'flex-start',
    textAlign: 'center',
    
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
  botonesContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    minWidth: width * 0.85,
  },
  botonesTitulo: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  filaBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  botonNumero: {
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonNumeroTexto: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoConexion: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
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
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 15,
    lineHeight: 22,
    textAlign: 'center',
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
    fontSize: 16,
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