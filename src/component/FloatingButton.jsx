import { useState } from "react";
import ChatPopUp from "./ChatPopUp";

const FloatingButton = () => {

    const [openChat , setOpenChat] = useState(false);

    return (
        
        <>
            {openChat ?
            (
                <ChatPopUp  setOpenChat={setOpenChat} />
            )
            :
            (   
            <>

                <button
                    className="fixed bottom-6 right-6 font-bold bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 hover:scale-110 transition"
                    onClick={() => setOpenChat(!openChat)}
                >
                    ASK AI
                </button>
            </>
            )
            }
        </>
    
    );
}

export default FloatingButton;