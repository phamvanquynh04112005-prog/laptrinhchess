// // src/components/layout/Layout.jsx
// import React from "react";
// import {
//   Box,
//   Flex,
//   Heading,
//   Button,
//   HStack,
//   IconButton,
// } from "@chakra-ui/react";
// import { Chess, Home, Users, Puzzle, BarChart } from "lucide-react";
// import { Link } from "react-router-dom";

// const Layout = ({ children }) => {
//   const navItems = [
//     { name: "Trang Chủ", icon: <Home size={18} />, path: "/" },
//     { name: "Chơi Cờ", icon: <Chess size={18} />, path: "/play" },
//     { name: "Hai Người", icon: <Users size={18} />, path: "/multiplayer" },
//     { name: "Câu Đố", icon: <Puzzle size={18} />, path: "/puzzles" },
//     { name: "Phân Tích", icon: <BarChart size={18} />, path: "/analysis" },
//   ];

//   return (
//     <Box minH="100vh" bg="gray.900" color="white">
//       <Flex
//         as="header"
//         bg="gray.800"
//         borderBottom="1px solid"
//         borderColor="gray.700"
//         py={4}
//         px={8}
//         align="center"
//       >
//         <Chess size={32} color="#3b82f6" style={{ marginRight: 16 }} />
//         <Heading
//           size="lg"
//           bgGradient="linear(to-r, blue.400, purple.500)"
//           bgClip="text"
//           flex="1"
//         >
//           ChessMaster Pro
//         </Heading>
//         <HStack spacing={2}>
//           {navItems.map((item) => (
//             <Button
//               key={item.name}
//               as={Link}
//               to={item.path}
//               leftIcon={item.icon}
//               variant="ghost"
//               colorScheme="blue"
//               size="sm"
//             >
//               {item.name}
//             </Button>
//           ))}
//         </HStack>
//       </Flex>
//       <Box as="main" p={4}>
//         {children}
//       </Box>
//     </Box>
//   );
// };

// export default Layout;
