
// query {
//     users {
//       id
//       name
//       createdAt 
//       updatedAt
//     }
//   }

// query {
//     users {
//       name
//       createdAt 
//       updatedAt
//       discussions {
//         title 
//         body
//       }
//     }
//   }

// mutation{
//     createUser(data: {
//       name:"Me Again",
//       email:"catherine.luse@gmail.com"
//     }){
//       id 
//       name
//       email
//     }
//   }


// mutation {
//     updateUser(
//       where:{
//         id:"ck9goq8tv00dy0739w94l8dyi"
//       }, 
//       data:{
//         name:"Yours Truly"
//         email:"catherineluse@gmail.com"
//     }){
//       id
//       name
//       email
//     }
//   }

//   mutation {
//     deleteUser(where:{id:"ck9f8h8yd000t0748ctwio7vc"}){
//       id 
//       name
//     }
//   }