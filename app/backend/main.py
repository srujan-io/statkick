from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI(
    title="StatKick API",
    description="Football player similarity and playing style analysis",
    version="1.0.0"
)

# CORS: allow the deployed Vercel frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://statkick-six.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "data/raw/players.csv"
PCA_PATH = "results/analysis/pca_player_scores.csv"


def load_players():
    df = pd.read_csv(DATA_PATH)

    df["Minutes"] = (
        df["Minutes"]
        .astype(str)
        .str.replace(",", "", regex=False)
        .astype(int)
    )

    df = df[df["Minutes"] > 0].copy()

    return df


def load_pca():
    return pd.read_csv(PCA_PATH)


@app.get("/")
def root():
    return {
        "message": "StatKick API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/players")
def get_players():
    df = load_players()

    players = df[
        [
            "Player",
            "Nation",
            "Position",
            "Age",
            "Minutes"
        ]
    ].to_dict(orient="records")

    return {
        "count": len(players),
        "players": players
    }


@app.get("/players/{player_name}")
def get_player(player_name: str):
    df = load_players()
    pca_df = load_pca()

    matches = df[
        df["Player"].str.lower() == player_name.lower()
    ]

    if matches.empty:
        raise HTTPException(
            status_code=404,
            detail="Player not found"
        )

    index = matches.index[0]
    player = matches.iloc[0]
    pca_player = pca_df.iloc[index]

    statistics = {
        "Goals Per 90": player["Goals Per 90"],
        "Assists Per 90": player["Assists Per 90"],
        "xG Per 90": player["xG Per 90"],
        "xAG Per 90": player["xAG Per 90"],
        "Progressive Carries Per 90": (
            player["Progressive Carries"]
            / player["Minutes"]
            * 90
        ),
        "Progressive Passes Per 90": (
            player["Progressive Passes"]
            / player["Minutes"]
            * 90
        ),
        "Progressive Receives Per 90": (
            player["Progressive Receives"]
            / player["Minutes"]
            * 90
        )
    }

    pca_coordinates = {
        f"PC{i}": pca_player[f"PC{i}"]
        for i in range(1, 8)
    }

    return {
        "player": player["Player"],
        "nation": player["Nation"],
        "position": player["Position"],
        "age": int(player["Age"]),
        "minutes": int(player["Minutes"]),
        "statistics": {
            name: float(value)
            for name, value in statistics.items()
        },
        "pca": {
            component: float(value)
            for component, value in pca_coordinates.items()
        }
    }


@app.get("/players/{player_name}/similar")
def get_similar_players(
    player_name: str,
    limit: int = 5
):
    df = load_players()
    pca_df = load_pca()

    matches = df[
        df["Player"].str.lower() == player_name.lower()
    ]

    if matches.empty:
        raise HTTPException(
            status_code=404,
            detail="Player not found"
        )

    player_index = matches.index[0]

    # Use the first five principal components
    pca_columns = [
        "PC1",
        "PC2",
        "PC3",
        "PC4",
        "PC5"
    ]

    target = pca_df.loc[
        player_index,
        pca_columns
    ].to_numpy(dtype=float)

    all_scores = pca_df[
        pca_columns
    ].to_numpy(dtype=float)

    # Euclidean distance in five-dimensional PCA space
    distances = (
        (all_scores - target) ** 2
    ).sum(axis=1) ** 0.5

    # Exclude the selected player from the results
    target_name = matches.iloc[0]["Player"]

    same_player = (
        df["Player"] == target_name
    ).to_numpy()

    distances[same_player] = float("inf")

    # Prevent invalid limits and oversized responses
    limit = max(1, min(limit, 50))

    nearest_indices = distances.argsort()[:limit]

    similar_players = []

    for index in nearest_indices:
        similar_players.append({
            "player": df.iloc[index]["Player"],
            "position": df.iloc[index]["Position"],
            "nation": df.iloc[index]["Nation"],
            "distance": round(
                float(distances[index]),
                4
            )
        })

    return {
        "player": target_name,
        "components_used": 5,
        "variance_captured": 88.85,
        "similar_players": similar_players
    }


@app.get("/pca")
def get_pca_data():
    df = load_players()
    pca_df = load_pca()

    result = []

    for index in range(len(df)):
        result.append({
            "player": df.iloc[index]["Player"],
            "position": df.iloc[index]["Position"],
            "nation": df.iloc[index]["Nation"],
            "PC1": float(pca_df.iloc[index]["PC1"]),
            "PC2": float(pca_df.iloc[index]["PC2"]),
            "PC3": float(pca_df.iloc[index]["PC3"]),
            "PC4": float(pca_df.iloc[index]["PC4"]),
            "PC5": float(pca_df.iloc[index]["PC5"]),
            "PC6": float(pca_df.iloc[index]["PC6"]),
            "PC7": float(pca_df.iloc[index]["PC7"])
        })

    return {
        "count": len(result),
        "variance": {
            "PC1": 34.35,
            "PC2": 19.90,
            "PC3": 14.23,
            "PC4": 11.82,
            "PC5": 8.56,
            "PC6": 6.17,
            "PC7": 4.97
        },
        "players": result
    }


@app.get("/stats")
def get_stats():
    return {
        "players": 2274,
        "features": 7,
        "pca_components": 7,
        "visualization_components": 2,
        "similarity_components": 5,
        "visualization_variance": 54.25,
        "similarity_variance": 88.85,
        "features_used": [
            "Goals Per 90",
            "Assists Per 90",
            "xG Per 90",
            "xAG Per 90",
            "Progressive Carries Per 90",
            "Progressive Passes Per 90",
            "Progressive Receives Per 90"
        ]
    }
