import "./UI-UX/Warning.model.css";

const Warning = ({ display_none, openSearchBar }) => {
    let flag = "";
    if (display_none) {
        flag = "display_none";
    }

    return (
        <div onClick={openSearchBar} className={`Warning ${flag}`}>
            <img className="warning-img" src="src/components/IMG/warning.jpg" />
            <h1 className="warning-text">You didn't log in</h1>
        </div>
    );
};

export default Warning;
