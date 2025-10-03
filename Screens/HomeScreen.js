// // screens/HomeScreen.js
// import React, { useRef, useState, useEffect } from 'react';
// import { View, Text, Button, ScrollView, StyleSheet, TouchableOpacity, Modal, Pressable, Alert, BackHandler, Animated } from 'react-native';
// import { Camera, CameraView } from 'expo-camera';
// import { Ionicons } from '@expo/vector-icons';

// export default function HomeScreen() {
//   const [isCameraVisible, setIsCameraVisible] = useState(false);
//   const [torchOn, setTorchOn] = useState(false);
//   const [hasPermission, setHasPermission] = useState(null);
//   const [scannedProducts, setScannedProducts] = useState([]);
//   const [paymentModalVisible, setPaymentModalVisible] = useState(false);

//   const cameraRef = useRef(null);
//   const scanLineAnim = useRef(new Animated.Value(0)).current;

//   const handleBarcodeScanned = ({ type, data }) => {
//     const newProduct = {
//       id: Date.now().toString(),
//       name: `Product ${scannedProducts.length + 1}`,
//       code: data,
//       type: type,
//       price: Math.floor(Math.random() * 100) + 1,
//       quantity: 1
//     };

//     setScannedProducts([...scannedProducts, newProduct]);
//     setIsCameraVisible(false);
//   };

//   useEffect(() => {
//     const backAction = () => {
//       if (isCameraVisible) {
//         setIsCameraVisible(false);
//         return true;
//       }
//       return false;
//     };
//     const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
//     return () => backHandler.remove();
//   }, [isCameraVisible]);

//   useEffect(() => {
//     if (isCameraVisible) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
//           Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
//         ])
//       ).start();
//     }
//   }, [isCameraVisible]);

//   const removeProduct = (id) => {
//     const updatedList = scannedProducts.filter((item) => item.id !== id);
//     setScannedProducts(updatedList);
//   };

//   const totalAmount = scannedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);

//   const handleCashPayment = () => {
//     const counter = Math.floor(Math.random() * 10) + 1;
//     const cashier = ['Anjali', 'Raj', 'Sneha', 'Mohit'][Math.floor(Math.random() * 4)];
//     setPaymentModalVisible(false);
//     Alert.alert('Cash Payment', `Please pay at counter D-${counter} to ${cashier}.`);
//   };

//   const handleOnlinePayment = (method) => {
//     setPaymentModalVisible(false);
//     Alert.alert('Online Payment', `You selected ${method} as your payment method.`);
//   };

//   return (
//     <View style={{ flex: 1 }}>
//       {isCameraVisible && hasPermission ? (
//         <View style={styles.cameraContainer}>
//           <CameraView
//             ref={cameraRef}
//             style={styles.camera}
//             onBarcodeScanned={handleBarcodeScanned}
//             flash={torchOn ? 'torch' : 'off'}
//             barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}
//           />
//           {/* Header */}
//           <View style={styles.topBar}>
//             <TouchableOpacity onPress={() => setIsCameraVisible(false)}>
//               <Ionicons name="arrow-back" size={28} color="white" />
//             </TouchableOpacity>
//             <Text style={styles.titleText}>Scan QR or Barcode</Text>
//             <TouchableOpacity onPress={() => setTorchOn(!torchOn)}>
//               <Ionicons name={torchOn ? 'flash' : 'flash-off'} size={28} color="white" />
//             </TouchableOpacity>
//           </View>

//           {/* Overlay */}
//           <View style={styles.overlay}>
//             <Animated.View
//               style={[
//                 styles.scanLine,
//                 {
//                   transform: [
//                     {
//                       translateY: scanLineAnim.interpolate({
//                         inputRange: [0, 1],
//                         outputRange: [0, 250],
//                       }),
//                     },
//                   ],
//                 },
//               ]}
//             />
//           </View>
//         </View>
//       ) : (
//         <ScrollView contentContainerStyle={styles.content}>
//           <Text style={styles.heading}>🧾 Retail Billing App</Text>

//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>📷 Scan Product</Text>
//             <Text style={styles.cardText}>Please click below to start scanning QR code.</Text>
//             <Button title="Start Scanning" onPress={() => setIsCameraVisible(true)} color="#007bff" />
//           </View>

//           <Text style={styles.cartIcon}>🛒 Cart</Text>

//           {scannedProducts.length === 0 ? (
//             <Text style={{ textAlign: 'center', marginTop: 10 }}>No products scanned yet.</Text>
//           ) : (
//             <View style={styles.table}>
//               <View style={styles.tableHeader}>
//                 <Text style={styles.th}>Sr</Text>
//                 <Text style={styles.th}>Name</Text>
//                 <Text style={styles.th}>Qty</Text>
//                 <Text style={styles.th}>Price</Text>
//                 <Text style={styles.th}>Remove</Text>
//               </View>

//               {scannedProducts.map((item, index) => (
//                 <View key={item.id} style={styles.tableRow}>
//                   <Text style={styles.td}>{index + 1}</Text>
//                   <Text style={styles.td}>{item.name}</Text>
//                   <Text style={styles.td}>{item.quantity}</Text>
//                   <Text style={styles.td}>₹{item.price}</Text>
//                   <TouchableOpacity onPress={() => removeProduct(item.id)}>
//                     <Text style={[styles.td, { color: 'red' }]}>Remove</Text>
//                   </TouchableOpacity>
//                 </View>
//               ))}

//               <View style={styles.tableRow}>
//                 <Text style={styles.td}></Text>
//                 <Text style={styles.td}></Text>
//                 <Text style={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>Total:</Text>
//                 <Text style={[styles.td, { fontWeight: 'bold' }]}>₹{totalAmount}</Text>
//                 <Text style={styles.td}></Text>
//               </View>

//               <View style={{ marginTop: 20 }}>
//                 <Button title="Checkout" onPress={() => setPaymentModalVisible(true)} color="green" />
//               </View>
//             </View>
//           )}

//           {/* Payment Modal */}
//           <Modal
//             visible={paymentModalVisible}
//             transparent={true}
//             animationType="slide"
//             onRequestClose={() => setPaymentModalVisible(false)}
//           >
//             <View style={styles.modalOverlay}>
//               <View style={styles.modalBox}>
//                 <Text style={styles.modalTitle}>Select Payment Method</Text>

//                 <Pressable style={styles.modalButton} onPress={handleCashPayment}>
//                   <Text style={styles.modalText}>💵 Cash</Text>
//                 </Pressable>

//                 <Pressable style={styles.modalButton} onPress={() => handleOnlinePayment("UPI")}>
//                   <Text style={styles.modalText}>📱 UPI</Text>
//                 </Pressable>

//                 <Pressable style={styles.modalButton} onPress={() => handleOnlinePayment("ATM Card")}>
//                   <Text style={styles.modalText}>💳 ATM Card</Text>
//                 </Pressable>

//                 <Pressable style={styles.modalButton} onPress={() => handleOnlinePayment("Net Banking")}>
//                   <Text style={styles.modalText}>🌐 Net Banking</Text>
//                 </Pressable>

//                 <Button title="Cancel" color="red" onPress={() => setPaymentModalVisible(false)} />
//               </View>
//             </View>
//           </Modal>
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   cameraContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', position: 'relative' },
//   camera: { width: '100%', height: '100%' },
//   overlay: {
//     position: 'absolute',
//     top: '20%',
//     width: '70%',
//     aspectRatio: 1,
//     borderColor: 'rgba(255, 0, 0, 0.4)',
//     borderWidth: 2,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   scanLine: { height: 2, width: '100%', backgroundColor: 'red' },
//   topBar: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     paddingTop: 40,
//     paddingHorizontal: 20,
//     paddingBottom: 10,
//     backgroundColor: 'rgba(83, 69, 69, 0.6)',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     zIndex: 10,
//     marginTop: 40,
//   },
//   titleText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
//   content: { padding: 20 },
//   heading: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, marginTop: 100 },
//   card: { backgroundColor: '#f5f5f5', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 3, marginBottom: 30 },
//   cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
//   cardText: { textAlign: 'center', marginBottom: 15 },
//   cartIcon: { fontSize: 20, textAlign: 'center', marginBottom: 15, fontWeight: 'bold' },
//   table: { marginTop: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, overflow: 'hidden' },
//   tableHeader: { flexDirection: 'row', backgroundColor: '#ddd', paddingVertical: 10 },
//   tableRow: { flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderColor: '#eee' },
//   th: { flex: 1, fontWeight: 'bold', textAlign: 'center' },
//   td: { flex: 1, textAlign: 'center' },
//   modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
//   modalBox: { width: '85%', backgroundColor: '#fff', borderRadius: 15, padding: 20, alignItems: 'center', gap: 10 },
//   modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
//   modalButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
//   modalText: { color: '#fff', fontWeight: 'bold' },
// });
