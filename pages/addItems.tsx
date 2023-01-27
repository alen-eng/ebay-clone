import React, { FormEvent, useState } from 'react';
import { useAddress, useContract } from '@thirdweb-dev/react';
import Header from '../components/Header';
import { useRouter } from 'next/router';
type Props = {}

function addItems({}: Props) {
  const address= useAddress();
  const router= useRouter();
  const [preview,setPreview]= useState<string>();
  const [image, setImage]=useState<File>();
  const {contract}= useContract (
 process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
 "nft-collection"
  );
  const mintNft= async (e : FormEvent<HTMLFormElement>) => {
   e.preventDefault();
   if(!contract || !address) return;

   if(!image){
    alert("Please add an Image!!");
    return;
   }
   const target= e.target as typeof e.target & {
    name : {value: string};
    description : {value: string};
   }
   const metadata= {
    name : target.name.value,
    description : target.description.value,
    image : image,
   }
      try{
          const tx=await contract.mintTo(address, metadata);
          const receipt= tx.receipt;
          const tokenId = tx.id;
          const nft = await tx.data();
          console.log(receipt, tokenId, nft);
          router.push('/');
      }
      catch(error)
      { 
        console.log(error)

      }

  };
  return (
    <div>
    <Header/>

        <main className='max-w-6xl mx-auto p-10 border'>
         <h1 className='text-4xl font-bold'>Add an Item</h1>
         <h2 className='text-xl font-semibold pt-5'>Item</h2>
         <p className='pb-5'>
          By adding an Item to the marketplace, you're eventually
           Minting an NFT of the item into your wallet which we can then list for sale ! </p>
        
        <div className='flex flex-col justify-center items-center md:flex-row md:space-x-5 pt-5'>
          <img className='border w-80 h-80 object-contain' 
          src={preview || 'https://links.papareact.com/ucj'}
           alt=''/>
          
          <form onSubmit={mintNft} className='flex flex-col flex-1 p-2 space-y-2 '>
        <label className='font-light'> Name of Item</label>
        <input 
        className='formField' 
        placeholder='Name of item...' 
        type='text'
        name='name'
        id='name'
        />
        <label className='font-light'> Description</label>
        <input
         className='formField'
          placeholder='Description of the item...'
           type='text'
           name='description'
           id='description'
           />
        <label className='font-light'>Image of Item</label>
            <input type='file'
             onChange={(e) =>{
              if(e.target.files?.[0]){
                setPreview(URL.createObjectURL(e.target.files[0]));
                setImage(e.target.files[0]);
              }
            }}/>
            <button type='submit' className='bg-blue-600 font-bold text-white rounded-full py-4 px-10 w-56 md:mt-auto mx-auto ml-auto'>Add/mint item</button>
          </form>
        </div>
        </main>
    </div>
  )
}

export default addItems;