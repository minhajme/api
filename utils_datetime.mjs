const current_time_info = () => {
    const dateObj = new Date();
    return {
        current_hour_id: "hourID:" + dateObj / (1000 * 3600),
        current_month_id:
            "monthID:" + dateObj.getFullYear() + "-" + dateObj.getMonth(),
    };
};

export { current_time_info };
