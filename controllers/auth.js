import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import axios from "axios"

import users from '../models/auth.js'

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try{
        const existinguser = await users.findOne({ email });
        if(existinguser){
            return res.status(404).json({ message: "User already Exist."})
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const newUser = await users.create({ name, email, password: hashedPassword }) 
        const token = jwt.sign({ email: newUser.email, id:newUser._id}, process.env.JWT_SECRET , { expiresIn: '1h'});
        res.status(200).json({ result: newUser, token })
    } catch(error){
        res.status(500).json("Something went worng...")
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existinguser = await users.findOne({ email });
        if(!existinguser){
            return res.status(404).json({ message: "User don't Exist."})
        }

        const isPasswordCrt = await bcrypt.compare(password, existinguser.password)
        if(!isPasswordCrt){
            return res.status(400).json({message : "Invalid credentials"})
        }
        const token = jwt.sign({ email: existinguser.email, id:existinguser._id}, process.env.JWT_SECRET , { expiresIn: '1h'});
        res.status(200).json({ result: existinguser, token })
    } catch (error)  {
        res.status(500).json("Something went worng...")
    }
}

export const sendOtp = async (req, res) => {
    const { name, phoneNumber } = req.body;

    const __otp  = Math.floor(100000 + Math.random() * 900000)
    const _otp = JSON.stringify(__otp)

    try {
        const existingUser = await users.findOne({ phoneNumber });

        if(!existingUser){
            const hashedOtp = await bcrypt.hash(_otp, 12)

            const newUser = await users.create({ name, phoneNumber, otp: hashedOtp })

            // Send sms to user

            const encodedParams = new URLSearchParams();
            encodedParams.append("to", '+91'+phoneNumber);
            encodedParams.append("p", process.env.SMS77IO_API_KEY);
            encodedParams.append("text", `Your login otp is ${_otp}`);

            const options = {
            method: 'POST',
            url: 'https://sms77io.p.rapidapi.com/sms',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'X-RapidAPI-Key': 'd977c3cedfmsh059155cca08f739p195990jsnd1bc22f0bf0f',
                'X-RapidAPI-Host': 'sms77io.p.rapidapi.com'
            },
            data: encodedParams
            };

            axios.request(options).then(function (response) {
                console.log(response.data);
            }).catch(function (error) {
                console.error(error);
            });

            return res.status(200).json({ newUser })
        }

        // Send sms to user

        const encodedParams = new URLSearchParams();
        encodedParams.append("to", '+91'+phoneNumber);
        encodedParams.append("p", process.env.SMS77IO_API_KEY);
        encodedParams.append("text", `Your login otp is ${_otp}`);

        const options = {
        method: 'POST',
        url: 'https://sms77io.p.rapidapi.com/sms',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': '2acb9a956dmsh66be44166ea64fdp1dbdcdjsn535fa7f4d1b0',
            'X-RapidAPI-Host': 'sms77io.p.rapidapi.com'
        },
        data: encodedParams
        };

        axios.request(options).then(function (response) {
            console.log(response.data);
        }).catch(function (error) {
            console.error(error);
        });
 

        // Update User model with otp

        const hashedOtp = await bcrypt.hash(_otp, 12)

        await users.updateOne({ phoneNumber: phoneNumber}, { otp: hashedOtp }, {name: name} )

        res.status(200).json({ result: existingUser })

    } catch (error) {
        res.status(404).json("User not found!")
    }
}

export const verifyOtp = async (req, res) => {
    const { phoneNumber, otp } = req.body;
    try {
        const existinguser = await users.findOne({ phoneNumber });
        
        if(!existinguser){
            return res.status(404).json("User doen't exists.")
        }

        const isOtpCorrect = await bcrypt.compare( otp, existinguser.otp )

        if(!isOtpCorrect) {
            return res.status(400).json("Invalid credentials")
        }

        const token = jwt.sign({ id: existinguser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ result: existinguser, token })
    } catch (error) {
        res.status(404).json("User not found!")
    }
}