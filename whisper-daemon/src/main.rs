use axum::{
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use enigo::{Enigo, KeyboardControllable};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

#[derive(Debug, Serialize, Deserialize)]
pub struct TranscriptionMessage {
    pub text: String,
}

fn simulate_typing(text: &str) {
    let mut enigo = Enigo::new();
    for c in text.chars() {
        enigo.key_sequence(&c.to_string());
    }
}

async fn handle_transcription(Json(payload): Json<TranscriptionMessage>) -> StatusCode {
    println!("Received transcription request: {:?}", payload);

    // Spawn a blocking task for the keyboard simulation
    tokio::task::spawn_blocking(move || {
        simulate_typing(&payload.text);
    });

    StatusCode::OK
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    // Initialize the router with our routes
    let app = Router::new()
        .route("/", post(handle_transcription))
        .route("/hello", get(|| async { "Hello" }));

    // Set up the server address
    let addr = SocketAddr::from(([127, 0, 0, 1], 9999));
    println!("Server starting on http://{}", addr);

    // Start the server
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}
