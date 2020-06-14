// query {
//     discussions {
//       title 
//       body
//       author {
//         name
//       }
//     }
//   }

//   mutation {
//     createDiscussion(
//       data:{
//         title:"Cat Question"
//         body:"What do I feed my cat?"
//         author:{
//           connect:{
//             id:"ck9goq8tv00dy0739w94l8dyi"
//           }
//         }
//       }
//     ){
//       id
//       title
//       body
//       author {
//         id 
//         name 
//         email
//       }
//     }
//   }