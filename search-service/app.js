import './config/loadEnv.js';

import express from 'express';
import cors from 'cors';

import { runConsumer } from './consumers/documentConsumer.js';

import searchRoute from './routes/search.js';
import healthRoutes from './routes/health.js';

const PORT = process.env.PORT;
const app = express();

// middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// routes
app.use('/health', healthRoutes);
app.use('/search', searchRoute);

// Start Kafka consumer
runConsumer();

app.listen(PORT, ()=>{
    console.log('Listening to Port:', PORT)
})